'use client';

import { motion } from 'framer-motion';
import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition } from '@/lib/saros/interfaces';
import { IOrder, OrderStatus } from '@/lib/saros/orders/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderListProps {
  position: IDLMMPosition;
}

export const OrderList: React.FC<OrderListProps> = ({ position }) => {
  const { orderManager } = usePositions();

  const orders = orderManager.getOrdersByPosition(position.address);
  const activeOrders = orders.filter(order => order.status === OrderStatus.ACTIVE);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const success = await orderManager.cancelOrder(orderId);
      if (success) {
        // TODO: Show success notification
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      // TODO: Show error notification
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.ACTIVE:
        return 'text-green-600 bg-green-50';
      case OrderStatus.EXECUTED:
        return 'text-blue-600 bg-blue-50';
      case OrderStatus.CANCELLED:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (activeOrders.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No active orders
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeOrders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {order.params.type}
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Trigger:</span>{' '}
              <span className="font-medium">
                {formatCurrency(order.params.triggerPrice)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>{' '}
              <span className="font-medium">
                {formatCurrency(order.params.amount)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="font-medium">
                {formatDate(order.createdAt / 1000)}
              </span>
            </div>
            {order.params.expiryTime && (
              <div>
                <span className="text-gray-500">Expires:</span>{' '}
                <span className="font-medium">
                  {formatDate(order.params.expiryTime / 1000)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleCancelOrder(order.id)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cancel Order
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
