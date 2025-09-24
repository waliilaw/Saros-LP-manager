import { PublicKey } from '@solana/web3.js';
import { requestCache } from '@/lib/utils/request-cache';
import { TimeSeriesData } from '../interfaces';

export interface PriceData {
  price: number;
  timestamp: number;
  volume24h: number;
  change24h: number;
  bid: number;
  ask: number;
}

export interface PriceFeedConfig {
  wsEndpoint?: string;
  httpEndpoint?: string;
  updateInterval?: number;
  reconnectInterval?: number;
  maxRetries?: number;
}

type PriceSubscriber = (price: PriceData) => void;

export class PriceFeedService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<PriceSubscriber>> = new Map();
  private prices: Map<string, PriceData> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(private config: PriceFeedConfig = {}) {
    this.config = {
      wsEndpoint: 'wss://api.saros.finance/v1/prices',
      httpEndpoint: 'https://api.saros.finance/v1/prices',
      updateInterval: 1000,
      reconnectInterval: 5000,
      maxRetries: 5,
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.config.wsEndpoint!);

      this.ws.onopen = () => {
        console.log('Price feed connected');
        this.reconnectAttempts = 0;
        this.setupPingInterval();
        
        // Resubscribe to all tokens
        Array.from(this.subscribers.keys()).forEach(token => {
          this.sendSubscription(token);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'price') {
            this.handlePriceUpdate(data);
          }
        } catch (error) {
          console.error('Failed to parse price feed message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Price feed disconnected');
        this.cleanup();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Price feed error:', error);
        this.ws?.close();
      };
    } catch (error) {
      console.error('Failed to connect to price feed:', error);
      this.scheduleReconnect();
    }
  }

  private setupPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.config.maxRetries!) {
      this.reconnectAttempts++;
      const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);
      
      this.reconnectTimeout = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxRetries})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private sendSubscription(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        token,
      }));
    }
  }

  private handlePriceUpdate(data: any): void {
    const { token, price, timestamp, volume24h, change24h, bid, ask } = data;
    
    const priceData: PriceData = {
      price,
      timestamp,
      volume24h,
      change24h,
      bid,
      ask,
    };

    this.prices.set(token, priceData);
    
    const subscribers = this.subscribers.get(token);
    if (subscribers) {
      subscribers.forEach(callback => callback(priceData));
    }
  }

  subscribe(token: string, callback: PriceSubscriber): () => void {
    if (!this.subscribers.has(token)) {
      this.subscribers.set(token, new Set());
      this.sendSubscription(token);
    }

    this.subscribers.get(token)!.add(callback);

    // Send initial price if available
    const currentPrice = this.prices.get(token);
    if (currentPrice) {
      callback(currentPrice);
    }

    return () => {
      const subscribers = this.subscribers.get(token);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(token);
          this.unsubscribe(token);
        }
      }
    };
  }

  private unsubscribe(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        token,
      }));
    }
  }

  async getPrice(token: string): Promise<PriceData | null> {
    // Try WebSocket price first
    const wsPrice = this.prices.get(token);
    if (wsPrice) return wsPrice;

    // Fallback to HTTP
    try {
      const cacheKey = `price:${token}`;
      return await requestCache.get(
        cacheKey,
        async () => {
          const response = await fetch(
            `${this.config.httpEndpoint}/${token}`
          );
          if (!response.ok) throw new Error('Failed to fetch price');
          return response.json();
        },
        { ttl: 10, staleWhileRevalidate: 30 }
      );
    } catch (error) {
      console.error(`Failed to fetch price for ${token}:`, error);
      return null;
    }
  }

  async getHistoricalPrices(
    token: string,
    startTime: number,
    endTime: number,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h'
  ): Promise<TimeSeriesData[]> {
    try {
      const cacheKey = `history:${token}:${startTime}:${endTime}:${interval}`;
      return await requestCache.get(
        cacheKey,
        async () => {
          const response = await fetch(
            `${this.config.httpEndpoint}/history/${token}?` +
            new URLSearchParams({
              start: startTime.toString(),
              end: endTime.toString(),
              interval,
            })
          );
          
          if (!response.ok) throw new Error('Failed to fetch historical prices');
          
          const data = await response.json();
          return data.map((item: any) => ({
            timestamp: item.timestamp,
            value: item.price,
          }));
        },
        { ttl: 300, staleWhileRevalidate: 600 }
      );
    } catch (error) {
      console.error(`Failed to fetch historical prices for ${token}:`, error);
      return [];
    }
  }

  async getAggregatedPrice(
    token: string,
    sources: string[] = ['saros', 'serum', 'raydium']
  ): Promise<number | null> {
    try {
      const prices = await Promise.all(
        sources.map(async source => {
          const response = await fetch(
            `${this.config.httpEndpoint}/aggregated/${token}/${source}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          return data.price;
        })
      );

      const validPrices = prices.filter((p): p is number => p !== null);
      if (validPrices.length === 0) return null;

      // Remove outliers (prices that deviate more than 2 standard deviations)
      const mean = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
      const stdDev = Math.sqrt(
        validPrices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / validPrices.length
      );

      const filteredPrices = validPrices.filter(
        p => Math.abs(p - mean) <= 2 * stdDev
      );

      // Return median of filtered prices
      const sorted = filteredPrices.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    } catch (error) {
      console.error(`Failed to fetch aggregated price for ${token}:`, error);
      return null;
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
