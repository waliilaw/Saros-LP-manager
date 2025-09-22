interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export function LoadingSpinner({ size = 'medium', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <svg
                className={`animate-spin text-blue-500 ${sizeClasses[size]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
}

interface LoadingStateProps {
    isLoading: boolean;
    children: React.ReactNode;
    className?: string;
    spinnerSize?: 'small' | 'medium' | 'large';
}

export function LoadingState({
    isLoading,
    children,
    className = '',
    spinnerSize = 'medium'
}: LoadingStateProps) {
    if (isLoading) {
        return (
            <div className={`relative ${className}`}>
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <LoadingSpinner size={spinnerSize} />
                </div>
                <div className="opacity-50 pointer-events-none">
                    {children}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

interface LoadingSkeletonProps {
    className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
    return (
        <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="space-y-3 mt-4">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
        </div>
    );
}