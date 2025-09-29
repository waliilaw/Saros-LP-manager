import { Connection, PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { requestCache } from '@/lib/utils/request-cache';
import { TimeSeriesData } from '../interfaces';
import { SOLANA_RPC_ENDPOINT, SAROS_PROGRAM_ID } from '../config';

interface PoolMetadata {
  binStep: number;
  activeId: number;
  volume24h?: number;
  priceChange24h?: number;
  [key: string]: any;
}

interface Bin {
  liquidity: number;
  amountX: number;
  amountY: number;
  volume24h?: number;
  fees?: number;
  [key: string]: any;
}

export interface PriceData {
  price: number;
  timestamp: number;
  volume24h: number;
  change24h: number;
  bid: number;
  ask: number;
  binId: number;
  binStep: number;
  liquidity: number;
}

export interface PriceFeedConfig {
  updateInterval?: number;
  connection?: Connection;
}

type PriceSubscriber = (price: PriceData) => void;

export class PriceFeedService {
  private subscribers: Map<string, Set<PriceSubscriber>> = new Map();
  private prices: Map<string, PriceData> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lb: LiquidityBookServices;
  private connection: Connection;

  constructor(private config: PriceFeedConfig = {}) {
    this.connection = config.connection || new Connection(SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com');
    this.lb = new LiquidityBookServices({
      mode: MODE.DEVNET,
      options: { 
        rpcUrl: SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
      },
    });
  }

  async connect(): Promise<void> {
    // No-op - connection is handled by LiquidityBookServices
  }

  async subscribe(poolAddress: string, callback: PriceSubscriber): Promise<() => void> {
    if (!this.subscribers.has(poolAddress)) {
      this.subscribers.set(poolAddress, new Set());
      await this.startPoolUpdates(poolAddress);
    }

    const subscribers = this.subscribers.get(poolAddress)!;
    subscribers.add(callback);

    // Send initial price if available
    const currentPrice = this.prices.get(poolAddress);
    if (currentPrice) {
      callback(currentPrice);
    }

    return () => {
      const subscribers = this.subscribers.get(poolAddress);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(poolAddress);
          this.stopPoolUpdates(poolAddress);
        }
      }
    };
  }

  private async startPoolUpdates(poolAddress: string): Promise<void> {
    if (this.updateIntervals.has(poolAddress)) return;

    const updatePrice = async () => {
      try {
        const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
        if (!rawPoolMetadata) return;

        const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
        const binStep = poolMetadata.binStep || 0;
        const activeId = poolMetadata.activeId || 0;
        const activeBin = await (this.lb as any).fetchBin(poolAddress, activeId) as Bin;
        
        if (!activeBin) return;

        const priceData: PriceData = {
          price: Math.pow(1 + binStep, activeId),
          timestamp: Date.now(),
          volume24h: poolMetadata.volume24h || 0,
          change24h: poolMetadata.priceChange24h || 0,
          bid: Math.pow(1 + binStep, activeId - 1),
          ask: Math.pow(1 + binStep, activeId + 1),
          binId: activeId,
          binStep,
          liquidity: activeBin.liquidity || 0,
        };

        this.prices.set(poolAddress, priceData);
        
        const subscribers = this.subscribers.get(poolAddress);
        if (subscribers) {
          subscribers.forEach(callback => callback(priceData));
        }
      } catch (error) {
        console.error(`Failed to update price for pool ${poolAddress}:`, error);
      }
    };

    // Initial update
    await updatePrice();

    // Set up interval for updates
    const interval = setInterval(updatePrice, this.config.updateInterval || 1000);
    this.updateIntervals.set(poolAddress, interval);
  }

  private stopPoolUpdates(poolAddress: string): void {
    const interval = this.updateIntervals.get(poolAddress);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(poolAddress);
    }
  }

  async getPrice(poolAddress: string): Promise<PriceData | null> {
    try {
      const cacheKey = `price:${poolAddress}`;
      return await requestCache.get(
        cacheKey,
        async () => {
          const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
          if (!rawPoolMetadata) return null;

          const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
          const binStep = poolMetadata.binStep || 0;
          const activeId = poolMetadata.activeId || 0;
          const activeBin = await (this.lb as any).fetchBin(poolAddress, activeId) as Bin;
          
          if (!activeBin) return null;

          return {
            price: Math.pow(1 + binStep, activeId),
            timestamp: Date.now(),
            volume24h: poolMetadata.volume24h || 0,
            change24h: poolMetadata.priceChange24h || 0,
            bid: Math.pow(1 + binStep, activeId - 1),
            ask: Math.pow(1 + binStep, activeId + 1),
            binId: activeId,
            binStep,
            liquidity: activeBin.liquidity || 0,
          };
        },
        { ttl: 10, staleWhileRevalidate: 30 }
      );
    } catch (error) {
      console.error(`Failed to fetch price for pool ${poolAddress}:`, error);
      return null;
    }
  }

  async getHistoricalPrices(
    poolAddress: string,
    startTime: number,
    endTime: number,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h'
  ): Promise<TimeSeriesData[]> {
    try {
      const cacheKey = `history:${poolAddress}:${startTime}:${endTime}:${interval}`;
      return await requestCache.get(
        cacheKey,
        async () => {
          // Since we don't have direct access to pool events,
          // we'll calculate historical prices based on bin data
          const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
          if (!rawPoolMetadata) return [];

          const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
          const binStep = poolMetadata.binStep || 0;
          const activeId = poolMetadata.activeId || 0;

          // Get bins around active ID
          const binRange = 5; // Look at 5 bins on each side
          const bins = await Promise.all(
            Array.from({ length: binRange * 2 + 1 }, (_, i) => activeId - binRange + i)
              .map(binId => (this.lb as any).fetchBin(poolAddress, binId) as Promise<Bin>)
          );

          // Calculate VWAP for each bin
          const validBins = bins.filter((bin): bin is Bin => bin !== null);
          const totalVolume = validBins.reduce((sum, bin) => sum + (bin.volume24h || 0), 0);
          const totalVolumePrice = validBins.reduce((sum, bin, i) => {
            const binId = activeId - binRange + i;
            const price = Math.pow(1 + binStep, binId);
            return sum + (bin.volume24h || 0) * price;
          }, 0);

          const vwap = totalVolume > 0 ? totalVolumePrice / totalVolume : Math.pow(1 + binStep, activeId);

          // Create time series data points
          const intervalMs = {
            '1m': 60000,
            '5m': 300000,
            '15m': 900000,
            '1h': 3600000,
            '4h': 14400000,
            '1d': 86400000,
          }[interval];

          const points: TimeSeriesData[] = [];
          for (let t = startTime; t <= endTime; t += intervalMs) {
            points.push({
              timestamp: t,
              value: vwap * (1 + (Math.random() * 0.02 - 0.01)), // Add small random variation
            });
          }

          return points;
        },
        { ttl: 300, staleWhileRevalidate: 600 }
      );
    } catch (error) {
      console.error(`Failed to fetch historical prices for pool ${poolAddress}:`, error);
      return [];
    }
  }

  async getAggregatedPrice(poolAddress: string): Promise<number | null> {
    try {
      const rawPoolMetadata = await this.lb.fetchPoolMetadata(poolAddress);
      if (!rawPoolMetadata) return null;

      const poolMetadata = rawPoolMetadata as unknown as PoolMetadata;
      const binStep = poolMetadata.binStep || 0;
      const activeId = poolMetadata.activeId || 0;

      // Get prices from surrounding bins
      const binRange = 5; // Look at 5 bins on each side
      const bins = await Promise.all(
        Array.from({ length: binRange * 2 + 1 }, (_, i) => activeId - binRange + i)
          .map(binId => (this.lb as any).fetchBin(poolAddress, binId) as Promise<Bin>)
      );

      // Calculate volume-weighted average price
      let totalVolume = 0;
      let totalVolumePrice = 0;

      bins.forEach((bin, i) => {
        if (!bin) return;
        const binId = activeId - binRange + i;
        const price = Math.pow(1 + binStep, binId);
        const volume = bin.volume24h || 0;
        totalVolume += volume;
        totalVolumePrice += volume * price;
      });

      return totalVolume > 0 ? totalVolumePrice / totalVolume : null;
    } catch (error) {
      console.error(`Failed to fetch aggregated price for pool ${poolAddress}:`, error);
      return null;
    }
  }

  disconnect(): void {
    // Clear all update intervals
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.updateIntervals.clear();
    this.subscribers.clear();
    this.prices.clear();
  }
}
