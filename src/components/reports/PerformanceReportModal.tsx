import { useState, useEffect } from 'react';
import { usePositions } from '@/context/PositionContext';
import { ReportGenerator, PerformanceReport } from '@/lib/saros/reports';
import { formatDate } from '@/lib/utils';

interface PerformanceReportModalProps {
    onClose: () => void;
}

export function PerformanceReportModal({ onClose }: PerformanceReportModalProps) {
    const { positions, positionMetrics } = usePositions();
    const [reports, setReports] = useState<PerformanceReport[]>([]);
    const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(new Set());
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        end: new Date().toISOString().split('T')[0],
    });

    const reportGenerator = new ReportGenerator();

    const handleDownload = () => {
        const filteredReports = reports.filter(report => 
            selectedPositionIds.has(report.positionId) &&
            new Date(report.timestamp) >= new Date(dateRange.start) &&
            new Date(report.timestamp) <= new Date(dateRange.end)
        );

        if (filteredReports.length === 0) {
            alert('No data available for the selected criteria');
            return;
        }

        const filename = `performance-report-${formatDate(Date.now())}.csv`;
        reportGenerator.downloadCSV(filteredReports, filename);
    };

    useEffect(() => {
        const newReports: PerformanceReport[] = [];
        positions.forEach(position => {
            const metrics = positionMetrics.get(position.address.toString());
            if (metrics) {
                newReports.push(reportGenerator.generatePositionReport(position, metrics));
            }
        });
        setReports(newReports);
    }, [positions, positionMetrics]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold">Generate Performance Report</h2>
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
                    {/* Date Range */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Position Selection */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Select Positions</h3>
                        <div className="max-h-48 overflow-y-auto">
                            {positions.map(position => (
                                <label
                                    key={position.address.toString()}
                                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPositionIds.has(position.address.toString())}
                                        onChange={(e) => {
                                            const newSelected = new Set(selectedPositionIds);
                                            if (e.target.checked) {
                                                newSelected.add(position.address.toString());
                                            } else {
                                                newSelected.delete(position.address.toString());
                                            }
                                            setSelectedPositionIds(newSelected);
                                        }}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Position #{position.address.toString().slice(0, 8)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Download Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleDownload}
                            disabled={selectedPositionIds.size === 0}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                        >
                            Download Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}