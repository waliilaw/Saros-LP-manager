import { PublicKey } from '@solana/web3.js';

export enum OrderType {
  LIMIT = 'LIMIT',
  STOP_LOSS = 'STOP_LOSS',
  TAKE_PROFIT = 'TAKE_PROFIT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
}

export enum TriggerType {
  PRICE_ABOVE = 'PRICE_ABOVE',
  PRICE_BELOW = 'PRICE_BELOW',
  HEALTH_BELOW = 'HEALTH_BELOW',
  APR_BELOW = 'APR_BELOW',
}

export interface OrderParams {
  positionId: PublicKey;
  type: OrderType;
  triggerType: TriggerType;
  triggerPrice: number;
  targetPrice?: number;
  amount: number;
  expiryTime?: number; // Unix timestamp
  maxSlippage?: number; // In percentage
}

export interface IOrder {
  id: string;
  params: OrderParams;
  status: OrderStatus;
  createdAt: number;
  executedAt?: number;
  cancelledAt?: number;
  transactionHash?: string;
}
