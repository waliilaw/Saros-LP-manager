import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { SOLANA_RPC_ENDPOINT, SOLANA_NETWORK } from './config';

export interface PriceData {
    price: number;
    timestamp: number;
    confidence: number;
}

export class PriceFeedService {
    private connection: Connection;
    private priceSubscriptions: Map<string, number> = new Map();
    private priceCallbacks: Map<string, ((price: PriceData) => void)[]> = new Map();

    constructor() {
        this.connection = new Connection(SOLANA_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK));
    }

    async subscribeToPriceFeed(tokenAddress: string, callback: (price: PriceData) => void): Promise<void> {
        if (!this.priceCallbacks.has(tokenAddress)) {
            this.priceCallbacks.set(tokenAddress, []);
            await this.startPriceFeedSubscription(tokenAddress);
        }

        this.priceCallbacks.get(tokenAddress)!.push(callback);
    }

    unsubscribeFromPriceFeed(tokenAddress: string, callback: (price: PriceData) => void): void {
        const callbacks = this.priceCallbacks.get(tokenAddress);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }

            if (callbacks.length === 0) {
                this.stopPriceFeedSubscription(tokenAddress);
            }
        }
    }

    private async startPriceFeedSubscription(tokenAddress: string): Promise<void> {
        try {
            // This is a placeholder for the actual price feed subscription logic
            // In a real implementation, you would:
            // 1. Find the price feed account for the token
            // 2. Subscribe to account changes
            // 3. Parse the data and update prices
            const interval = setInterval(() => {
                const mockPrice: PriceData = {
                    price: Math.random() * 100 + 50, // Mock price between 50-150
                    timestamp: Date.now(),
                    confidence: 0.95,
                };

                this.notifyPriceUpdate(tokenAddress, mockPrice);
            }, 5000); // Update every 5 seconds

            this.priceSubscriptions.set(tokenAddress, interval as unknown as number);
        } catch (error) {
            console.error('Failed to start price feed subscription:', error);
            throw error;
        }
    }

    private stopPriceFeedSubscription(tokenAddress: string): void {
        const subscriptionId = this.priceSubscriptions.get(tokenAddress);
        if (subscriptionId) {
            clearInterval(subscriptionId);
            this.priceSubscriptions.delete(tokenAddress);
            this.priceCallbacks.delete(tokenAddress);
        }
    }

    private notifyPriceUpdate(tokenAddress: string, price: PriceData): void {
        const callbacks = this.priceCallbacks.get(tokenAddress);
        if (callbacks) {
            callbacks.forEach(callback => callback(price));
        }
    }

    // Utility method to get the latest price synchronously
    async getLatestPrice(tokenAddress: string): Promise<PriceData> {
        try {
            // This is a placeholder for actual price fetching logic
            // In a real implementation, you would:
            // 1. Find the price feed account for the token
            // 2. Fetch the account data
            // 3. Parse and return the price
            return {
                price: Math.random() * 100 + 50,
                timestamp: Date.now(),
                confidence: 0.95,
            };
        } catch (error) {
            console.error('Failed to fetch latest price:', error);
            throw error;
        }
    }
}