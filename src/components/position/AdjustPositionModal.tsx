import { useState } from 'react';
import { usePositions } from '@/context/PositionContext';
import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';
import { formatNumber, formatPrice } from '@/lib/utils';

interface AdjustPositionModalProps {
    position: IDLMMPosition;
    metrics: IPositionMetrics;
    onClose: () => void;
}

export function AdjustPositionModal({ position, metrics, onClose }: AdjustPositionModalProps) {
    const { adjustPosition } = usePositions();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newLowerBinId, setNewLowerBinId] = useState<number>(position.lowerBinId);
    const [newUpperBinId, setNewUpperBinId] = useState<number>(position.upperBinId);
    const [addAmount, setAddAmount] = useState<string>('');
    const [removeAmount, setRemoveAmount] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const success = await adjustPosition({
                positionId: position.address.toString(),
                newLowerBinId: newLowerBinId !== position.lowerBinId ? newLowerBinId : undefined,
                newUpperBinId: newUpperBinId !== position.upperBinId ? newUpperBinId : undefined,
                addAmount: addAmount ? Number(addAmount) : undefined,
                removeAmount: removeAmount ? Number(removeAmount) : undefined,
            });

            if (success) {
                onClose();
            } else {
                setError('Failed to adjust position');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">Adjust Position</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Price Range
                            </label>
                            <div className="mt-1 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-500">Lower Price</label>
                                    <input
                                        type="number"
                                        value={newLowerBinId}
                                        onChange={(e) => setNewLowerBinId(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500">Upper Price</label>
                                    <input
                                        type="number"
                                        value={newUpperBinId}
                                        onChange={(e) => setNewUpperBinId(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Liquidity Adjustment
                            </label>
                            <div className="mt-1 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-500">Add Amount</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={addAmount}
                                        onChange={(e) => setAddAmount(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500">Remove Amount</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={removeAmount}
                                        onChange={(e) => setRemoveAmount(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm mt-2">
                                {error}
                            </div>
                        )}

                        <div className="mt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {isLoading ? 'Adjusting...' : 'Confirm Adjustment'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}