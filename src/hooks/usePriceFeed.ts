import { useState, useEffect, useCallback } from 'react';
import { PriceData } from '@/lib/saros/price-feed/service';
import { usePositions } from '@/context/PositionContext';

export interface PriceSubscription {
  token: string;
  price: number | null;
  data: PriceData | null;
  loading: boolean;
  error: string | null;
}

export function usePriceFeed(tokens: string[]): {
  prices: Map<string, PriceSubscription>;
  getHistoricalPrices: (
    token: string,
    startTime: number,
    endTime: number,
    interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  ) => Promise<{ timestamp: number; value: number }[]>;
  getAggregatedPrice: (token: string, sources?: string[]) => Promise<number | null>;
} {
  const { priceFeedService } = usePositions();
  const [prices, setPrices] = useState<Map<string, PriceSubscription>>(new Map());

  // Initialize price subscriptions
  useEffect(() => {
    const newPrices = new Map<string, PriceSubscription>();
    tokens.forEach(token => {
      newPrices.set(token, {
        token,
        price: null,
        data: null,
        loading: true,
        error: null,
      });
    });
    setPrices(newPrices);
  }, [tokens.join(',')]);

  // Subscribe to price updates
  useEffect(() => {
    const unsubscribers = tokens.map(token => {
      return priceFeedService.subscribe(token, (priceData) => {
        setPrices(prev => {
          const newPrices = new Map(prev);
          newPrices.set(token, {
            token,
            price: priceData.price,
            data: priceData,
            loading: false,
            error: null,
          });
          return newPrices;
        });
      });
    });

    // Initial price fetch
    tokens.forEach(async (token) => {
      try {
        const priceData = await priceFeedService.getPrice(token);
        if (priceData) {
          setPrices(prev => {
            const newPrices = new Map(prev);
            newPrices.set(token, {
              token,
              price: priceData.price,
              data: priceData,
              loading: false,
              error: null,
            });
            return newPrices;
          });
        }
      } catch (error) {
        setPrices(prev => {
          const newPrices = new Map(prev);
          newPrices.set(token, {
            token,
            price: null,
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch price',
          });
          return newPrices;
        });
      }
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [priceFeedService, tokens.join(',')]);

  const getHistoricalPrices = useCallback(
    async (
      token: string,
      startTime: number,
      endTime: number,
      interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h'
    ) => {
      return priceFeedService.getHistoricalPrices(token, startTime, endTime, interval);
    },
    [priceFeedService]
  );

  const getAggregatedPrice = useCallback(
    async (token: string, sources?: string[]) => {
      return priceFeedService.getAggregatedPrice(token, sources);
    },
    [priceFeedService]
  );

  return {
    prices,
    getHistoricalPrices,
    getAggregatedPrice,
  };
}
