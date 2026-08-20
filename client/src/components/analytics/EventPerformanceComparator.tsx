'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { EventPerformanceData, ChartTheme, LoadingState } from '../../types/analytics';

interface EventPerformanceComparatorProps {
  data: EventPerformanceData[];
  selectedMetrics: string[];
  onMetricToggle: (metric: string) => void;
  availableMetrics: string[];
  theme: ChartTheme;
  loading: LoadingState;
  className?: string;
  userTier: 'basic' | 'pro' | 'unlimited';
  onEventSelect?: (eventId: string) => void;
  showBenchmarks?: boolean;
  sortBy?: 'name' | 'attendance' | 'revenue' | 'satisfaction';
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, order: 'asc' | 'desc') => void;
}

const EventPerformanceComparator: React.FC<EventPerformanceComparatorProps> = ({
  data,
  selectedMetrics,
  onMetricToggle,
  availableMetrics,
  theme: _theme,
  loading,
  className = '',
  userTier,
  onEventSelect,
  showBenchmarks = false,
  sortBy = 'name',
  sortOrder = 'asc',
  onSort
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'combined'>('combined');
  const [showDataTable, setShowDataTable] = useState(false);

  // Sort and filter data based on user tier
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply tier-based filtering
    if (userTier === 'basic') {
      filtered = filtered.slice(0, 5); // Limit to 5 events for basic tier
    } else if (userTier === 'pro') {
      filtered = filtered.slice(0, 20); // Limit to 20 events for pro tier
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      // Map 'name' sortBy option to 'eventName' property
      const sortKey = sortBy === 'name' ? 'eventName' : sortBy;
      let aValue: string | number = a[sortKey as keyof EventPerformanceData] as string | number;
      let bValue: string | number = b[sortKey as keyof EventPerformanceData] as string | number;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [data, userTier, sortBy, sortOrder]);

  // Calculate benchmarks
  const benchmarks = useMemo(() => {
    if (!showBenchmarks || processedData.length === 0) return {};
    
    const totals = processedData.reduce(
      (acc, event) => ({
        attendance: acc.attendance + event.attendance,
        revenue: acc.revenue + event.revenue,
        satisfaction: acc.satisfaction + event.satisfaction
      }),
      { attendance: 0, revenue: 0, satisfaction: 0 }
    );
    
    return {
      attendance: totals.attendance / processedData.length,
      revenue: totals.revenue / processedData.length,
      satisfaction: totals.satisfaction / processedData.length
    };
  }, [processedData, showBenchmarks]);

  const handleEventClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0] && onEventSelect) {
      const eventData = data.activePayload[0].payload;
      onEventSelect(eventData.eventId);
    }
  }, [onEventSelect]);

  const handleEventSelection = useCallback((eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  }, []);

  const handleSortChange = useCallback((metric: string) => {
    if (onSort) {
      const newOrder = sortBy === metric && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(metric, newOrder);
    }
  }, [sortBy, sortOrder, onSort]);

  const getBarColor = useCallback((eventId: string, metricIndex: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
    
    if (selectedEvents.includes(eventId)) {
      return colors[metricIndex % colors.length];
    }
    
    return hoveredEvent === eventId 
      ? colors[metricIndex % colors.length]
      : `${colors[metricIndex % colors.length]}80`; // 50% opacity
  }, [selectedEvents, hoveredEvent]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      name: string;
      value: number;
      payload: EventPerformanceData;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg border bg-background border-border text-foreground">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={entry.dataKey || `entry-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
          {showBenchmarks && benchmarks[payload[0]?.dataKey as keyof typeof benchmarks] && (
            <p className="text-xs mt-1 opacity-75">
              Benchmark: {benchmarks[payload[0].dataKey as keyof typeof benchmarks]?.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading.isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading.error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading event performance data</p>
          <p className="text-sm text-muted-foreground">{loading.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`event-performance-comparator ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">
            Event Performance Comparator
            {userTier === 'basic' && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                Basic: 5 events max
              </span>
            )}
            {userTier === 'pro' && (
              <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                Pro: 20 events max
              </span>
            )}
          </h3>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
              aria-label={showDataTable ? 'Hide data table' : 'Show data table'}
            >
              {showDataTable ? 'Hide Table' : 'Show Table'}
            </button>
            
            {userTier !== 'basic' && (
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'combined')}
                className="px-3 py-1 text-sm border rounded"
                aria-label="Select chart type"
              >
                <option value="combined">Combined Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            )}
          </div>
        </div>

        {/* Metric Controls */}
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map(metric => (
            <button
              key={metric}
              onClick={() => onMetricToggle(metric)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedMetrics.includes(metric)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-pressed={selectedMetrics.includes(metric)}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Sort by:</span>
          {['name', 'attendance', 'revenue', 'satisfaction'].map(metric => (
            <button
              key={metric}
              onClick={() => handleSortChange(metric)}
              className={`text-sm px-2 py-1 rounded transition-colors ${
                sortBy === metric
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              aria-label={`Sort by ${metric} ${sortBy === metric ? (sortOrder === 'asc' ? 'descending' : 'ascending') : ''}`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
              {sortBy === metric && (
                <span className="ml-1">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 mb-6" role="img" aria-label="Event performance comparison chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onClick={handleEventClick}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Render metrics based on chart type and selection */}
            {selectedMetrics.includes('attendance') && (
              chartType === 'line' ? (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="attendance"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                <Bar yAxisId="left" dataKey="attendance" fill="#8884d8">
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.eventId, 0)} />
                  ))}
                </Bar>
              )
            )}
            
            {selectedMetrics.includes('revenue') && (
              chartType === 'line' ? (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d">
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.eventId, 1)} />
                  ))}
                </Bar>
              )
            )}
            
            {selectedMetrics.includes('satisfaction') && (
              chartType === 'line' ? (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#ffc658"
                  strokeWidth={2}
                  dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                <Bar yAxisId="left" dataKey="satisfaction" fill="#ffc658">
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.eventId, 2)} />
                  ))}
                </Bar>
              )
            )}
            
            {/* Benchmark Reference Lines */}
            {showBenchmarks && selectedMetrics.includes('attendance') && benchmarks.attendance && (
              <ReferenceLine
                yAxisId="left"
                y={benchmarks.attendance}
                stroke="#8884d8"
                strokeDasharray="8 8"
                label="Avg Attendance"
              />
            )}
            
            {showBenchmarks && selectedMetrics.includes('revenue') && benchmarks.revenue && (
              <ReferenceLine
                yAxisId="right"
                y={benchmarks.revenue}
                stroke="#82ca9d"
                strokeDasharray="8 8"
                label="Avg Revenue"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      {showDataTable && (
        <div className="overflow-x-auto">
          <table className="w-full border border-border rounded-lg">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Event Name</th>
                {selectedMetrics.includes('attendance') && <th className="px-4 py-2 text-right">Attendance</th>}
                {selectedMetrics.includes('revenue') && <th className="px-4 py-2 text-right">Revenue</th>}
                {selectedMetrics.includes('satisfaction') && <th className="px-4 py-2 text-right">Satisfaction</th>}
                <th className="px-4 py-2 text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((event, _index) => (
                <tr 
                  key={event.eventId} 
                  className={`border-t hover:bg-muted ${
                    selectedEvents.includes(event.eventId) ? 'bg-primary/5' : ''
                  }`}
                  onMouseEnter={() => setHoveredEvent(event.eventId)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEventSelection(event.eventId)}
                      className="text-left hover:text-primary transition-colors"
                    >
                      {event.eventName}
                    </button>
                  </td>
                  {selectedMetrics.includes('attendance') && (
                    <td className="px-4 py-2 text-right">{event.attendance.toLocaleString()}</td>
                  )}
                  {selectedMetrics.includes('revenue') && (
                    <td className="px-4 py-2 text-right">${event.revenue.toLocaleString()}</td>
                  )}
                  {selectedMetrics.includes('satisfaction') && (
                    <td className="px-4 py-2 text-right">{event.satisfaction}/10</td>
                  )}
                  <td className="px-4 py-2 text-center">
                    {new Date(event.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {userTier !== 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {selectedMetrics.includes('attendance') && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <h4 className="font-medium text-primary">Total Attendance</h4>
              <p className="text-2xl font-bold text-primary">
                {processedData.reduce((sum, event) => sum + event.attendance, 0).toLocaleString()}
              </p>
              {showBenchmarks && benchmarks.attendance && (
                <p className="text-sm text-primary/80">Avg: {Math.round(benchmarks.attendance).toLocaleString()}</p>
              )}
            </div>
          )}
          
          {selectedMetrics.includes('revenue') && (
            <div className="p-4 bg-success/10 rounded-lg">
              <h4 className="font-medium text-success">Total Revenue</h4>
              <p className="text-2xl font-bold text-success">
                ${processedData.reduce((sum, event) => sum + event.revenue, 0).toLocaleString()}
              </p>
              {showBenchmarks && benchmarks.revenue && (
                <p className="text-sm text-success/80">Avg: ${Math.round(benchmarks.revenue).toLocaleString()}</p>
              )}
            </div>
          )}
          
          {selectedMetrics.includes('satisfaction') && (
            <div className="p-4 bg-warning/10 rounded-lg">
              <h4 className="font-medium text-warning">Avg Satisfaction</h4>
              <p className="text-2xl font-bold text-warning">
                {(processedData.reduce((sum, event) => sum + event.satisfaction, 0) / processedData.length).toFixed(1)}/10
              </p>
              {showBenchmarks && benchmarks.satisfaction && (
                <p className="text-sm text-warning/80">Benchmark: {benchmarks.satisfaction.toFixed(1)}/10</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventPerformanceComparator;