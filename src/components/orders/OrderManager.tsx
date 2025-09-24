'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition } from '@/lib/saros/interfaces';
import { OrderType, TriggerType, OrderParams } from '@/lib/saros/orders/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface OrderManagerProps {
  position: IDLMMPosition;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ position }) => {
  const { orderManager } = usePositions();
  const [orderType, setOrderType] = useState<OrderType>(OrderType.LIMIT);
  const [triggerType, setTriggerType] = useState<TriggerType>(TriggerType.PRICE_ABOVE);
  const [triggerPrice, setTriggerPrice] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [maxSlippage, setMaxSlippage] = useState<number>(1); // 1%
  const [expiryHours, setExpiryHours] = useState<number>(24);

  const handleCreateOrder = async () => {
    const params: OrderParams = {
      positionId: position.address,
      type: orderType,
      triggerType,
      triggerPrice,
      amount,
      maxSlippage,
      expiryTime: expiryHours > 0 ? Date.now() + expiryHours * 3600000 : undefined,
    };

    try {
      const order = await orderManager.createOrder(params);
      console.log('Order created:', order);
      // TODO: Show success notification
    } catch (error) {
      console.error('Failed to create order:', error);
      // TODO: Show error notification
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">
        Create Order
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Type
          </label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Object.values(OrderType).map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Condition
          </label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Object.values(TriggerType).map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Price
          </label>
          <input
            type="number"
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(Number(e.target.value))}
            min={0}
            step={0.000001}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Slippage (%)
          </label>
          <input
            type="number"
            value={maxSlippage}
            onChange={(e) => setMaxSlippage(Number(e.target.value))}
            min={0.1}
            max={100}
            step={0.1}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry (hours)
          </label>
          <input
            type="number"
            value={expiryHours}
            onChange={(e) => setExpiryHours(Number(e.target.value))}
            min={0}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Set to 0 for no expiry
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={handleCreateOrder}
            className="w-full button-primary"
          >
            Create Order
          </button>
        </div>
      </div>
    </motion.div>
  );
};
