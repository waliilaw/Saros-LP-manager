'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { LimitOrderService, LimitOrder } from '@/lib/saros/limit-orders/service';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface LimitOrderListProps {
  poolAddress: string;
  onOrderCancelled?: (order: LimitOrder) => void;
}

export function LimitOrderList({
  poolAddress,
  onOrderCancelled,
}: LimitOrderListProps) {
  const { publicKey, signAndSendTransaction } = useWallet();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const limitOrderService = new LimitOrderService();
      const userOrders = await limitOrderService.getUserLimitOrders({
        payer: publicKey.toString(),
        poolAddress,
      });

      setOrders(userOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [publicKey, poolAddress]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancelOrder = useCallback(async (order: LimitOrder) => {
    if (!publicKey) return;

    try {
      setCancellingOrders(prev => new Set([...prev, order.id]));
      setError(null);

      const limitOrderService = new LimitOrderService();
      await limitOrderService.cancelLimitOrder({
        orderId: order.id,
        payer: publicKey.toString(),
        signAndSendTransaction,
      });

      onOrderCancelled?.(order);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingOrders(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  }, [publicKey, signAndSendTransaction, loadOrders, onOrderCancelled]);

  if (!publicKey) {
    return (
      <div className="text-center text-gray-500">
        Connect your wallet to view limit orders
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500">
        Loading limit orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No limit orders found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Your Limit Orders</h3>
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-lg rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    order.isBuy ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {order.isBuy ? 'Buy' : 'Sell'}
                  </span>
                  <span className="text-gray-600">
                    {order.isTokenA ? order.tokenA : order.tokenB}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Amount: {formatCurrency(order.amount)}
                </div>
                <div className="text-sm text-gray-500">
                  Target Price: {formatCurrency(order.targetPrice)}
                </div>
              </div>
              <button
                onClick={() => handleCancelOrder(order)}
                disabled={cancellingOrders.has(order.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  cancellingOrders.has(order.id)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {cancellingOrders.has(order.id) ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
