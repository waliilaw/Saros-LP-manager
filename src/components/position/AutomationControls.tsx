'use client';

import { useState } from 'react';
import { IRebalancingStrategy } from '@/lib/saros/automation/strategy';
import { usePositions } from '@/context/PositionContext';

import { IDLMMPosition } from '@/lib/saros/interfaces';

interface AutomationControlsProps {
    position: IDLMMPosition;
    onClose: () => void;
}

export function AutomationControls({ position, onClose }: AutomationControlsProps) {
    const positionId = position.address.toString();
    const [activeStrategies, setActiveStrategies] = useState<Set<string>>(new Set());
    const { automationManager } = usePositions();

    const handleStrategyToggle = (strategyId: string) => {
        const newActiveStrategies = new Set(activeStrategies);
        
        if (newActiveStrategies.has(strategyId)) {
            newActiveStrategies.delete(strategyId);
            automationManager.deactivateStrategy(positionId, strategyId);
        } else {
            newActiveStrategies.add(strategyId);
            automationManager.activateStrategy(positionId, strategyId);
        }
        
        setActiveStrategies(newActiveStrategies);
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">Automation Settings</h2>
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

            <div className="space-y-4">
                {Array.from(automationManager.strategies.values()).map((strategy: IRebalancingStrategy) => (
                    <div
                        key={strategy.id}
                        className="p-4 bg-gray-50 rounded-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">{strategy.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {strategy.description}
                                </p>
                            </div>
                            <div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={activeStrategies.has(strategy.id)}
                                        onChange={() => handleStrategyToggle(strategy.id)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-sm text-gray-500">
                <p>
                    Automated strategies will execute based on market conditions and position health.
                    You can disable them at any time.
                </p>
            </div>
        </div>
    );
}