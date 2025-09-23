import { usePositions } from '@/context/PositionContext';import { usePositions } from '@/context/PositionContext';import { usePositions } from '@/context/PositionContext';import { usePositions } from '@/context/PositionContext';

import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';

import { formatNumber, formatDate, formatPrice, formatTokenAmount } from '@/lib/utils';import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';

import { useMemo, useState } from 'react';

import { LoadingState, LoadingSkeleton } from '../common/LoadingStates';import { formatNumber, formatDate, formatPrice, formatTokenAmount } from '@/lib/utils';import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';import { IDLMMPosition, IPositionMetrics } from '@/lib/saros/interfaces';



interface PositionDetailsProps {import { useMemo, useState } from 'react';

    positionId: string;

    onClose: () => void;import { AdjustPositionModal } from './AdjustPositionModal';import { formatNumber, formatDate, formatPrice, formatTokenAmount } from '@/lib/utils';import { formatNumber, formatDate, formatPrice, formatTokenAmount } from '@/lib/utils';

}

import { PositionHealthPanel } from './PositionHealthPanel';

export function PositionDetails({ positionId, onClose }: PositionDetailsProps) {

    const { positions, positionMetrics } = usePositions();import { PositionHealthMonitor } from '@/lib/saros/position-health';import { useMemo, useState, Suspense } from 'react';import { useMemo, useState, Suspense } from 'react';

    const [isAdjusting, setIsAdjusting] = useState(false);

import { AutomationControls } from './AutomationControls';

    const position = useMemo(() => 

        positions.find(p => p.address.toString() === positionId),import { ErrorBoundary } from '../common/ErrorBoundary';import { AdjustPositionModal } from './AdjustPositionModal';import { AdjustPositionModal } from './AdjustPositionModal';

        [positions, positionId]

    );import { LoadingState, LoadingSkeleton } from '../common/LoadingStates';



    const metrics = useMemo(() => import { PositionHealthPanel } from './PositionHealthPanel';import { PositionHealthPanel } from './PositionHealthPanel';

        position ? positionMetrics.get(positionId) : null,

        [position, positionMetrics, positionId]interface PositionDetailsProps {

    );

    positionId: string;import { PositionHealthMonitor } from '@/lib/saros/position-health';import { PositionHealthMonitor } from '@/lib/saros/position-health';

    if (!position || !metrics) {

        return (    onClose: () => void;

            <LoadingSkeleton className="p-4">

                <div className="text-gray-500">Loading position details...</div>}import { AutomationControls } from './AutomationControls';import { AutomationControls } from './AutomationControls';

            </LoadingSkeleton>

        );

    }

export function PositionDetails({ positionId, onClose }: PositionDetailsProps) {import { ErrorBoundary } from '../common/ErrorBoundary';import { ErrorBoundary } from '../common/ErrorBoundary';

    return (

        <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">    const { positions, positionMetrics } = usePositions();

            <div className="p-6">

                <div className="text-2xl font-semibold">    const [isAdjusting, setIsAdjusting] = useState(false);import { LoadingState, LoadingSkeleton } from '../common/LoadingStates';import { LoadingState, LoadingSkeleton } from '../common/LoadingStates';

                    Position #{positionId.slice(0, 8)}

                </div>    const [showAutomation, setShowAutomation] = useState(false);

            </div>

        </div>    const healthMonitor = useMemo(() => new PositionHealthMonitor(), []);

    );

}

    const position = useMemo(() => interface PositionDetailsProps {interface PositionDetailsProps {

        positions.find(p => p.address.toString() === positionId),

        [positions, positionId]    positionId: string;    positionId: string;

    );

    onClose: () => void;    onClose: () => void;

    const metrics = useMemo(() => 

        position ? positionMetrics.get(positionId) : null,}}

        [position, positionMetrics, positionId]

    );



    const health = useMemo(() => export function PositionDetails({ positionId, onClose }: PositionDetailsProps) {export function PositionDetails({ positionId, onClose }: PositionDetailsProps) {

        position && metrics ? healthMonitor.calculateHealth(position, metrics) : null,

        [position, metrics, healthMonitor]    const { positions, positionMetrics } = usePositions();    const { positions, positionMetrics } = usePositions();

    );

    const [isAdjusting, setIsAdjusting] = useState(false);    const [isAdjusting, setIsAdjusting] = useState(false);

    if (!position || !metrics) {

        return (    const [showAutomation, setShowAutomation] = useState(false);    const [showAutomation, setShowAutomation] = useState(false);

            <LoadingSkeleton className="p-4">

                <div className="text-gray-500">Loading position details...</div>    const healthMonitor = useMemo(() => new PositionHealthMonitor(), []);    const healthMonitor = useMemo(() => new PositionHealthMonitor(), []);

            </LoadingSkeleton>

        );

    }

    const position = useMemo(() =>     const position = useMemo(() => 

    return (

        <ErrorBoundary>        positions.find(p => p.address.toString() === positionId),        positions.find(p => p.address.toString() === positionId),

            <LoadingState isLoading={!position || !metrics}>

                <div>Basic content</div>        [positions, positionId]        [positions, positionId]

            </LoadingState>

        </ErrorBoundary>    );    );

    );

}

    const metrics = useMemo(() =>     const metrics = useMemo(() => 

        position ? positionMetrics.get(positionId) : null,        position ? positionMetrics.get(positionId) : null,

        [position, positionMetrics, positionId]        [position, positionMetrics, positionId]

    );    );



    const health = useMemo(() =>     const health = useMemo(() => 

        position && metrics ? healthMonitor.calculateHealth(position, metrics) : null,        position && metrics ? healthMonitor.calculateHealth(position, metrics) : null,

        [position, metrics, healthMonitor]        [position, metrics, healthMonitor]

    );    );



    if (!position || !metrics) {    if (!position || !metrics) {

        return (        return (

            <LoadingSkeleton className="p-4">            <LoadingSkeleton className="p-4">

                <div className="text-gray-500">Loading position details...</div>                <div className="text-gray-500">Loading position details...</div>

            </LoadingSkeleton>            </LoadingSkeleton>

        );        );

    }    }



    return (    return (

        <ErrorBoundary>        <ErrorBoundary>

            <LoadingState isLoading={!position || !metrics}>            <LoadingState isLoading={!position || !metrics}>

                <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">                <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">

                    <div className="p-6">                    <div className="p-6">

                        <div className="flex justify-between items-start">                        <div className="flex justify-between items-start">

                            <div>                            <div>

                                <h2 className="text-2xl font-semibold">                                <h2 className="text-2xl font-semibold">

                                    Position #{positionId.slice(0, 8)}                                    Position #{positionId.slice(0, 8)}

                                </h2>                                </h2>

                                <div className="text-gray-500 mt-1">                                <div className="text-gray-500 mt-1">

                                    Created {formatDate(position.lastUpdatedAt)}                                    Created {formatDate(position.lastUpdatedAt)}

                                </div>                                </div>

                            </div>                            </div>

                            <button                            <button

                                onClick={onClose}                                onClick={onClose}

                                className="p-2 hover:bg-gray-100 rounded-full"                                className="p-2 hover:bg-gray-100 rounded-full"

                            >                            >

                                <span className="sr-only">Close</span>                                <span className="sr-only">Close</span>

                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                                </svg>                                </svg>

                            </button>                            </button>

                        </div>                        </div>



                        {/* Position Overview */}                {/* Position Overview */}

                        <div className="mt-6 grid grid-cols-2 gap-6">                <div className="mt-6 grid grid-cols-2 gap-6">

                            <div>                    <div>

                                <div className="text-gray-500">Total Value Locked</div>                        <div className="text-gray-500">Total Value Locked</div>

                                <div className="text-2xl font-semibold">                        <div className="text-2xl font-semibold">

                                    ${formatNumber(metrics.totalValueLocked)}                            ${formatNumber(metrics.totalValueLocked)}

                                </div>                        </div>

                            </div>                    </div>

                            <div>                    <div>

                                <div className="text-gray-500">Current APR</div>                        <div className="text-gray-500">Current APR</div>

                                <div className="text-2xl font-semibold">                        <div className="text-2xl font-semibold">

                                    {formatNumber(metrics.apr)}%                            {formatNumber(metrics.apr)}%

                                </div>                        </div>

                            </div>                    </div>

                        </div>                </div>



                        {/* Token Amounts */}                {/* Token Amounts */}

                        <div className="mt-8">                <div className="mt-8">

                            <h3 className="text-lg font-medium mb-4">Token Deposits</h3>                    <h3 className="text-lg font-medium mb-4">Token Deposits</h3>

                            <div className="grid grid-cols-2 gap-4">                    <div className="grid grid-cols-2 gap-4">

                                <div className="p-4 bg-gray-50 rounded-lg">                        <div className="p-4 bg-gray-50 rounded-lg">

                                    <div className="text-gray-500">Token X</div>                            <div className="text-gray-500">Token X</div>

                                    <div className="mt-1 font-medium">                            <div className="mt-1 font-medium">

                                        {formatTokenAmount(                                {formatTokenAmount(

                                            Number(position.tokenXDeposited),                                    Number(position.tokenXDeposited),

                                            'X',                                    'X',

                                            6                                    6

                                        )}                                )}

                                    </div>                            </div>

                                </div>                        </div>

                                <div className="p-4 bg-gray-50 rounded-lg">                        <div className="p-4 bg-gray-50 rounded-lg">

                                    <div className="text-gray-500">Token Y</div>                            <div className="text-gray-500">Token Y</div>

                                    <div className="mt-1 font-medium">                            <div className="mt-1 font-medium">

                                        {formatTokenAmount(                                {formatTokenAmount(

                                            Number(position.tokenYDeposited),                                    Number(position.tokenYDeposited),

                                            'Y',                                    'Y',

                                            6                                    6

                                        )}                                )}

                                    </div>                            </div>

                                </div>                        </div>

                            </div>                    </div>

                        </div>                </div>



                        {/* Price Range */}                {/* Price Range */}

                        <div className="mt-8">                <div className="mt-8">

                            <h3 className="text-lg font-medium mb-4">Price Range</h3>                    <h3 className="text-lg font-medium mb-4">Price Range</h3>

                            <div className="p-4 bg-gray-50 rounded-lg">                    <div className="p-4 bg-gray-50 rounded-lg">

                                <div className="grid grid-cols-3 gap-4">                        <div className="grid grid-cols-3 gap-4">

                                    <div>                            <div>

                                        <div className="text-gray-500">Min Price</div>                                <div className="text-gray-500">Min Price</div>

                                        <div className="mt-1 font-medium">                                <div className="mt-1 font-medium">

                                            ${formatPrice(metrics.priceRange.min)}                                    ${formatPrice(metrics.priceRange.min)}

                                        </div>                                </div>

                                    </div>                            </div>

                                    <div>                            <div>

                                        <div className="text-gray-500">Current Price</div>                                <div className="text-gray-500">Current Price</div>

                                        <div className="mt-1 font-medium">                                <div className="mt-1 font-medium">

                                            ${formatPrice(metrics.priceRange.current)}                                    ${formatPrice(metrics.priceRange.current)}

                                        </div>                                </div>

                                    </div>                            </div>

                                    <div>                            <div>

                                        <div className="text-gray-500">Max Price</div>                                <div className="text-gray-500">Max Price</div>

                                        <div className="mt-1 font-medium">                                <div className="mt-1 font-medium">

                                            ${formatPrice(metrics.priceRange.max)}                                    ${formatPrice(metrics.priceRange.max)}

                                        </div>                                </div>

                                    </div>                            </div>

                                </div>                        </div>

                                <div className="mt-4 h-2 bg-gray-200 rounded-full">                        <div className="mt-4 h-2 bg-gray-200 rounded-full">

                                    <div                            <div

                                        className="h-full bg-blue-500 rounded-full"                                className="h-full bg-blue-500 rounded-full"

                                        style={{                                style={{

                                            width: `${metrics.binUtilization}%`                                    width: `${metrics.binUtilization}%`

                                        }}                                }}

                                    />                            />

                                </div>                        </div>

                                <div className="mt-2 text-sm text-gray-500 text-center">                        <div className="mt-2 text-sm text-gray-500 text-center">

                                    {metrics.binUtilization}% Utilized                            {metrics.binUtilization}% Utilized

                                </div>                        </div>

                            </div>                    </div>

                        </div>                </div>



                        {/* Performance Metrics */}                {/* Performance Metrics */}

                        <div className="mt-8">                <div className="mt-8">

                            <h3 className="text-lg font-medium mb-4">Performance</h3>                    <h3 className="text-lg font-medium mb-4">Performance</h3>

                            <div className="grid grid-cols-2 gap-4">                    <div className="grid grid-cols-2 gap-4">

                                <div className="p-4 bg-gray-50 rounded-lg">                        <div className="p-4 bg-gray-50 rounded-lg">

                                    <div className="text-gray-500">24h Volume</div>                            <div className="text-gray-500">24h Volume</div>

                                    <div className="mt-1 font-medium">                            <div className="mt-1 font-medium">

                                        ${formatNumber(metrics.volumeLast24h)}                                ${formatNumber(metrics.volumeLast24h)}

                                    </div>                            </div>

                                </div>                        </div>

                                <div className="p-4 bg-gray-50 rounded-lg">                        <div className="p-4 bg-gray-50 rounded-lg">

                                    <div className="text-gray-500">24h Fees Earned</div>                            <div className="text-gray-500">24h Fees Earned</div>

                                    <div className="mt-1 font-medium">                            <div className="mt-1 font-medium">

                                        ${formatNumber(metrics.feesLast24h)}                                ${formatNumber(metrics.feesLast24h)}

                                    </div>                            </div>

                                </div>                        </div>

                                <div className="p-4 bg-gray-50 rounded-lg">                        <div className="p-4 bg-gray-50 rounded-lg">

                                    <div className="text-gray-500">Impermanent Loss</div>                            <div className="text-gray-500">Impermanent Loss</div>

                                    <div className="mt-1 font-medium text-red-600">                            <div className="mt-1 font-medium text-red-600">

                                        -${formatNumber(metrics.impermanentLoss)}                                -${formatNumber(metrics.impermanentLoss)}

                                    </div>                            </div>

                                </div>                        </div>

                                <div className="p-4 bg-gray-50 rounded-lg">                        <div className="p-4 bg-gray-50 rounded-lg">

                                    <div className="text-gray-500">Total Fees Earned</div>                            <div className="text-gray-500">Total Fees Earned</div>

                                    <div className="mt-1 font-medium">                            <div className="mt-1 font-medium">

                                        ${formatNumber(                                ${formatNumber(

                                            Number(position.feesEarnedX) + Number(position.feesEarnedY)                                    Number(position.feesEarnedX) + Number(position.feesEarnedY)

                                        )}                                )}

                                    </div>                            </div>

                                </div>                        </div>

                            </div>                    </div>

                        </div>                </div>



                        {/* Health Panel */}                {/* Health Panel */}

                        {health && <PositionHealthPanel health={health} />}                {health && <PositionHealthPanel health={health} />}



                        {/* Action Buttons */}                {/* Action Buttons */}

                        <div className="mt-8 flex space-x-4">                <div className="mt-8 flex space-x-4">

                            <button                    <button

                                onClick={() => setIsAdjusting(true)}                        onClick={() => setIsAdjusting(true)}

                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"

                            >                    >

                                Adjust Position                        Adjust Position

                            </button>                    </button>

                            <button                    <button

                                onClick={() => setShowAutomation(true)}                        onClick={() => setShowAutomation(true)}

                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"

                            >                    >

                                Automation Settings                        Automation Settings

                            </button>                    </button>

                        </div>                </div>

                    </div>            </div>



                    {/* Position Adjustment Modal */}            {/* Position Adjustment Modal */}

                    {isAdjusting && (            {isAdjusting && (

                        <AdjustPositionModal                <AdjustPositionModal

                            position={position}                    position={position}

                            metrics={metrics}                    metrics={metrics}

                            onClose={() => setIsAdjusting(false)}                    onClose={() => setIsAdjusting(false)}

                        />                />

                    )}            )}



                    {/* Automation Controls Modal */}            {/* Automation Controls Modal */}

                    {showAutomation && (            {showAutomation && (

                        <AutomationControls                <AutomationControls

                            positionId={positionId}                    positionId={positionId}

                            onClose={() => setShowAutomation(false)}                    onClose={() => setShowAutomation(false)}

                        />                />

                    )}            )}

                </div>        </div>

            </LoadingState>    );

        </ErrorBoundary>}
    );
}