/**
 * Format a number for display
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string with commas and specified decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format a Unix timestamp to a readable date string
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Shorten an address for display
 * @param address Full address string
 * @param chars Number of characters to show at start and end
 * @returns Shortened address with ellipsis
 */
export function shortenAddress(address: string, chars: number = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Calculate percentage change
 * @param current Current value
 * @param previous Previous value
 * @returns Percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Format basis points to percentage
 * @param bps Basis points (1 bps = 0.01%)
 * @returns Percentage string
 */
export function bpsToPercentage(bps: number): string {
    return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Format a price with appropriate decimals based on magnitude
 * @param price Price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
    if (price < 0.01) return price.toExponential(2);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return formatNumber(price, 0);
}

/**
 * Format a token amount with symbol
 * @param amount Token amount
 * @param symbol Token symbol
 * @param decimals Token decimals
 * @returns Formatted token amount string
 */
export function formatTokenAmount(amount: number, symbol: string, decimals: number = 6): string {
    const formatted = formatNumber(amount, decimals);
    return `${formatted} ${symbol}`;
}

/**
 * Format a currency value
 * @param value Number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format a percentage value
 * @param value Number to format as percentage
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'exceptZero',
    }).format(value / 100);
}