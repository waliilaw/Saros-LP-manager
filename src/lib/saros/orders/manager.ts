import { PublicKey } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';
import { SarosDLMMService } from '../dlmm-service';
import { PriceFeedService } from '../price-feed';
import { IOrder, OrderParams, OrderStatus, OrderType, TriggerType } from './types';

export class OrderManager {
  private orders: Map<string, IOrder> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    private dlmmService: SarosDLMMService,
    private priceFeedService: PriceFeedService,
  ) {
    this.startMonitoring();
  }

  async createOrder(params: OrderParams): Promise<IOrder> {
    const order: IOrder = {
      id: uuidv4(),
      params,
      status: OrderStatus.PENDING,
      createdAt: Date.now(),
    };

    // Validate order parameters
    await this.validateOrder(order);

    // Store order
    this.orders.set(order.id, order);
    order.status = OrderStatus.ACTIVE;

    return order;
  }

  private async validateOrder(order: IOrder): Promise<void> {
    const { params } = order;

    // Check if position exists
    const position = await this.dlmmService.getPosition(params.positionId.toString());
    if (!position) {
      throw new Error('Position not found');
    }

    // Validate trigger price
    const currentPrice = await this.priceFeedService.getPrice(position.pool.toString());
    if (!currentPrice) {
      throw new Error('Failed to get current price');
    }

    // Validate amount
    if (params.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Validate expiry time
    if (params.expiryTime && params.expiryTime <= Date.now()) {
      throw new Error('Invalid expiry time');
    }

    // Validate slippage
    if (params.maxSlippage && (params.maxSlippage <= 0 || params.maxSlippage > 100)) {
      throw new Error('Invalid slippage percentage');
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order || order.status !== OrderStatus.ACTIVE) {
      return false;
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = Date.now();
    this.orders.set(orderId, order);

    return true;
  }

  getOrder(orderId: string): IOrder | undefined {
    return this.orders.get(orderId);
  }

  getOrdersByPosition(positionId: PublicKey): IOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.params.positionId.equals(positionId)
    );
  }

  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkOrders();
    }, 10000); // Check every 10 seconds
  }

  private async checkOrders(): Promise<void> {
    for (const order of this.orders.values()) {
      if (order.status !== OrderStatus.ACTIVE) continue;

      try {
        const shouldExecute = await this.checkOrderConditions(order);
        if (shouldExecute) {
          await this.executeOrder(order);
        }
      } catch (error) {
        console.error(`Error checking order ${order.id}:`, error);
      }
    }
  }

  private async checkOrderConditions(order: IOrder): Promise<boolean> {
    const { params } = order;
    const position = await this.dlmmService.getPosition(params.positionId.toString());
    if (!position) return false;

    const currentPrice = await this.priceFeedService.getPrice(position.pool.toString());
    if (!currentPrice) return false;

    // Check expiry
    if (params.expiryTime && Date.now() > params.expiryTime) {
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = Date.now();
      return false;
    }

    switch (params.triggerType) {
      case TriggerType.PRICE_ABOVE:
        return currentPrice >= params.triggerPrice;
      case TriggerType.PRICE_BELOW:
        return currentPrice <= params.triggerPrice;
      case TriggerType.HEALTH_BELOW:
        return position.healthFactor < params.triggerPrice;
      case TriggerType.APR_BELOW:
        const metrics = await this.dlmmService.getPositionMetrics(params.positionId.toString());
        return metrics?.apr < params.triggerPrice;
      default:
        return false;
    }
  }

  private async executeOrder(order: IOrder): Promise<void> {
    const { params } = order;
    const position = await this.dlmmService.getPosition(params.positionId.toString());
    if (!position) throw new Error('Position not found');

    try {
      let success = false;

      switch (params.type) {
        case OrderType.LIMIT:
          success = await this.executeLimitOrder(order, position);
          break;
        case OrderType.STOP_LOSS:
          success = await this.executeStopLossOrder(order, position);
          break;
        case OrderType.TAKE_PROFIT:
          success = await this.executeTakeProfitOrder(order, position);
          break;
      }

      if (success) {
        order.status = OrderStatus.EXECUTED;
        order.executedAt = Date.now();
      }
    } catch (error) {
      console.error(`Failed to execute order ${order.id}:`, error);
    }
  }

  private async executeLimitOrder(order: IOrder, position: any): Promise<boolean> {
    // Implement limit order execution logic
    const success = await this.dlmmService.adjustPosition({
      position,
      addAmount: order.params.amount,
      newLowerBinId: Math.floor(order.params.triggerPrice * 0.99), // 1% range
      newUpperBinId: Math.ceil(order.params.triggerPrice * 1.01),
    });

    return success;
  }

  private async executeStopLossOrder(order: IOrder, position: any): Promise<boolean> {
    // Implement stop loss execution logic
    const success = await this.dlmmService.adjustPosition({
      position,
      removeAmount: order.params.amount,
    });

    return success;
  }

  private async executeTakeProfitOrder(order: IOrder, position: any): Promise<boolean> {
    // Implement take profit execution logic
    const success = await this.dlmmService.adjustPosition({
      position,
      removeAmount: order.params.amount,
    });

    return success;
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
