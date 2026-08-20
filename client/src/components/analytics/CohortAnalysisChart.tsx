'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { CohortData, ChartTheme, LoadingState } from '../../types/analytics';
import { logger } from '@/lib/logger';
import { COHORT_PALETTES, COHORT_FALLBACK_COLORS } from '@/utils/chartColors';

interface CohortAnalysisChartProps {
  data: CohortData[];
  theme: ChartTheme;
  loading: LoadingState;
  className?: string;
  userTier: 'basic' | 'pro' | 'unlimited';
  onCellClick?: (cohort: string, period: number, value: number) => void;
  showLabels?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'custom';
  customColors?: string[];
  animationDuration?: number;
  showTooltip?: boolean;
  exportable?: boolean;
  showDataTable?: boolean;
}

interface ProcessedCohortCell {
  cohort: string;
  period: number;
  value: number;
  percentage: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const CohortAnalysisChart: React.FC<CohortAnalysisChartProps> = ({
  data,
  theme,
  loading,
  className = '',
  userTier,
  onCellClick,
  showLabels = true,
  colorScheme = 'blue',
  customColors,
  animationDuration = 1000,
  showTooltip = true,
  exportable = false,
  showDataTable: initialShowDataTable = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredCell, setHoveredCell] = useState<ProcessedCohortCell | null>(null);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [showDataTable, setShowDataTable] = useState(initialShowDataTable);
  const [viewMode, setViewMode] = useState<'heatmap' | 'retention' | 'trends'>('heatmap');
  const [currentColorScheme, setColorScheme] = useState<'blue' | 'green' | 'purple' | 'custom'>(colorScheme);

  // Process data based on user tier
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply tier-based limitations
    if (userTier === 'basic') {
      filtered = filtered.slice(0, 6); // Limit to 6 cohorts for basic tier
    } else if (userTier === 'pro') {
      filtered = filtered.slice(0, 12); // Limit to 12 cohorts for pro tier
    }
    
    return filtered;
  }, [data, userTier]);

  // Generate color scale with robust fallbacks
  const colorScale = useMemo(() => {
    const colorPalettes = {
      blue: COHORT_PALETTES.blue,
      green: COHORT_PALETTES.green,
      purple: COHORT_PALETTES.purple,
      custom: customColors || [...COHORT_FALLBACK_COLORS]
    };

    const selectedColors = customColors || colorPalettes[currentColorScheme] || colorPalettes.blue;
    const colorArray = Array.isArray(selectedColors) && selectedColors.length > 0
      ? selectedColors
      : [...COHORT_FALLBACK_COLORS];
    
    // Create a robust color scale function
    const createColorScale = (colors: string[]) => {
      return (value: number) => {
        const normalizedValue = Math.max(0, Math.min(100, value || 0));
        const index = Math.floor((normalizedValue / 100) * (colors.length - 1));
        const clampedIndex = Math.max(0, Math.min(index, colors.length - 1));
        return colors[clampedIndex];
      };
    };
    
    // Try D3 scale if available, otherwise use fallback
    try {
      if (typeof window !== 'undefined' && d3?.scaleSequential && d3?.interpolateRgbBasis) {
        const scale = d3.scaleSequential(d3.interpolateRgbBasis(colorArray))
          .domain([0, 100]);
        
        // Validate scale works
        const testValue = scale(50);
        if (typeof testValue === 'string' && testValue.startsWith('#')) {
          return scale;
        }
      }
    } catch (error) {
      logger.warn('analytics', 'D3 scale creation failed, using fallback', { error });
    }

    // Fallback color scale
    return createColorScale(colorArray);
  }, [currentColorScheme, customColors]);

  // Calculate chart dimensions and cell positions
  const chartData = useMemo(() => {
    if (processedData.length === 0) return [];
    
    const margin = { top: 60, right: 60, bottom: 60, left: 120 };
    const availableWidth = dimensions.width - margin.left - margin.right;
    const availableHeight = dimensions.height - margin.top - margin.bottom;
    
    const maxPeriods = Math.max(...processedData.map(d => d.retentionRates.length));
    const cellWidth = availableWidth / maxPeriods;
    const cellHeight = availableHeight / processedData.length;
    
    const cells: ProcessedCohortCell[] = [];
    
    processedData.forEach((cohort, cohortIndex) => {
      cohort.retentionRates.forEach((rate, periodIndex) => {
        cells.push({
          cohort: cohort.cohort,
          period: periodIndex,
          value: cohort.initialSize > 0 ? (rate / cohort.initialSize) * 100 : 0,
          percentage: rate,
          x: margin.left + periodIndex * cellWidth,
          y: margin.top + cohortIndex * cellHeight,
          width: cellWidth,
          height: cellHeight
        });
      });
    });
    
    return cells;
  }, [processedData, dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: Math.max(400, container.clientWidth * 0.6)
          });
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render heatmap with robust D3 integration
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;
    
    // Skip rendering in test environment or when D3 is not available
    if (typeof window === 'undefined' || !d3?.select) {
      return;
    }
    
    try {
      const svg = d3.select(svgRef.current);
      if (!svg?.selectAll) {
        return;
      }
      
      svg.selectAll('*').remove(); // Clear previous render
      
      // Create main group
      const g = svg.append('g');
      
      // Add cells
      const cells = g.selectAll('.cohort-cell')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'cohort-cell')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('fill', d => {
          try {
            const color = colorScale(d.value);
            return typeof color === 'string' ? color : COHORT_FALLBACK_COLORS[0];
          } catch {
            return COHORT_FALLBACK_COLORS[0];
          }
        })
        .attr('stroke', theme.grid)
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .style('opacity', 0)
        .on('mouseover', (event, d) => {
          setHoveredCell(d);
          if (showTooltip && tooltipRef.current) {
            try {
              const tooltip = d3.select(tooltipRef.current);
              tooltip.transition().duration(200).style('opacity', 1);
              tooltip.style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
            } catch {
              // Ignore tooltip errors
            }
          }
        })
        .on('mouseout', () => {
          setHoveredCell(null);
          if (showTooltip && tooltipRef.current) {
            try {
              d3.select(tooltipRef.current).transition().duration(200).style('opacity', 0);
            } catch {
              // Ignore tooltip errors
            }
          }
        })
        .on('click', (event, d) => {
          if (onCellClick) {
            onCellClick(d.cohort, d.period, d.value);
          }
        });
      
      // Animate cells in
      try {
        cells.transition()
          .duration(animationDuration)
          .delay((_d, i) => i * 50)
          .style('opacity', 1);
      } catch {
        // Fallback: set opacity without animation
        cells.style('opacity', 1);
      }
    
      // Add labels if enabled
      if (showLabels && userTier !== 'basic') {
        try {
          const labels = g.selectAll('.cohort-label')
            .data(chartData.filter(d => d.value >= 10)) // Only show labels for significant values
            .enter()
            .append('text')
            .attr('class', 'cohort-label')
            .attr('x', d => d.x + d.width / 2)
            .attr('y', d => d.y + d.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', d => d.value > 50 ? '#ffffff' : theme.text)
            .style('opacity', 0)
            .text(d => `${Math.round(d.value)}%`);
          
          try {
            labels.transition()
              .duration(animationDuration)
              .delay((_d, i) => i * 50 + 500)
              .style('opacity', 1);
          } catch {
            // Fallback: set opacity without animation
            labels.style('opacity', 1);
          }
        } catch {
          // Skip labels if there's an error
        }
      }
    
      // Add axis labels
      const margin = { top: 60, right: 60, bottom: 60, left: 120 };
      
      try {
        // Cohort labels (Y-axis)
        g.selectAll('.cohort-y-label')
          .data(processedData)
          .enter()
          .append('text')
          .attr('class', 'cohort-y-label')
          .attr('x', margin.left - 10)
          .attr('y', (_d, i) => margin.top + (i + 0.5) * ((dimensions.height - margin.top - margin.bottom) / processedData.length))
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '12px')
          .attr('fill', theme.text)
          .text(d => d.cohort);
        
        // Period labels (X-axis)
        const maxPeriods = Math.max(...processedData.map(d => d.retentionRates.length));
        g.selectAll('.period-x-label')
          .data(Array.from({ length: maxPeriods }, (_, i) => i))
          .enter()
          .append('text')
          .attr('class', 'period-x-label')
          .attr('x', i => margin.left + (i + 0.5) * ((dimensions.width - margin.left - margin.right) / maxPeriods))
          .attr('y', margin.top - 10)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', theme.text)
          .text(i => `Period ${i + 1}`);
        
        // Add axis titles
        g.append('text')
          .attr('x', margin.left / 2)
          .attr('y', dimensions.height / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', theme.text)
          .attr('transform', `rotate(-90, ${margin.left / 2}, ${dimensions.height / 2})`)
          .text('Cohorts');
        
        g.append('text')
          .attr('x', dimensions.width / 2)
          .attr('y', 30)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', theme.text)
          .text('Retention Periods');
      } catch {
        // Skip axis labels if there's an error
      }

    } catch (error) {
      logger.warn('analytics', 'D3 rendering error', { error });
    }
  }, [chartData, colorScale, theme, showLabels, userTier, animationDuration, dimensions, onCellClick, processedData, showTooltip]);

  const handleCohortToggle = useCallback((cohort: string) => {
    setSelectedCohorts(prev => 
      prev.includes(cohort)
        ? prev.filter(c => c !== cohort)
        : [...prev, cohort]
    );
  }, []);

  const exportChart = useCallback(() => {
    if (!svgRef.current) return;
    
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `cohort-analysis-${new Date().toISOString().split('T')[0]}.svg`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      logger.error('analytics', 'Cohort analysis export failed', { error });
      // Could show user notification here
    }
  }, []);

  if (loading.isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`} data-testid="cohort-loading-skeleton">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading.error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading cohort analysis data</p>
          <p className="text-sm text-muted-foreground">{loading.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cohort-analysis-chart ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">
            Cohort Retention Analysis
            {userTier === 'basic' && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                Basic: 6 cohorts max
              </span>
            )}
            {userTier === 'pro' && (
              <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                Pro: 12 cohorts max
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
              <>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'heatmap' | 'retention' | 'trends')}
                  className="px-3 py-1 text-sm border rounded"
                  aria-label="Select view mode"
                >
                  <option value="heatmap">Heatmap View</option>
                  <option value="retention">Retention View</option>
                  <option value="trends">Trends View</option>
                </select>
                
                <select
                  value={currentColorScheme}
                  onChange={(e) => setColorScheme(e.target.value as 'blue' | 'green' | 'purple' | 'custom')}
                  className="px-3 py-1 text-sm border rounded"
                  aria-label="Select color scheme"
                >
                  <option value="blue">Blue Palette</option>
                  <option value="green">Green Palette</option>
                  <option value="purple">Purple Palette</option>
                </select>
              </>
            )}
            
            {exportable && userTier === 'unlimited' && (
              <button
                onClick={exportChart}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                aria-label="Export chart"
              >
                Export SVG
              </button>
            )}
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Retention Rate:</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs">0%</span>
            <div className="flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4"
                  style={{ backgroundColor: colorScale(i * 10) }}
                ></div>
              ))}
            </div>
            <span className="text-xs">100%</span>
          </div>
        </div>
        
        {/* Cohort Filters */}
        {userTier !== 'basic' && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Filter Cohorts:</span>
            {processedData.map(cohort => (
              <button
                key={cohort.cohort}
                onClick={() => handleCohortToggle(cohort.cohort)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCohorts.length === 0 || selectedCohorts.includes(cohort.cohort)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                aria-pressed={selectedCohorts.length === 0 || selectedCohorts.includes(cohort.cohort)}
              >
                {cohort.cohort}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border rounded-lg"
          role="img"
          aria-label="Cohort retention analysis heatmap"
        />
        
        {/* Tooltip */}
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none p-2 rounded shadow-lg opacity-0 transition-opacity duration-200 z-10 bg-background border border-border text-foreground"
          >
            {hoveredCell && (
              <div className="text-sm">
                <p className="font-medium">{hoveredCell.cohort}</p>
                <p>Period: {hoveredCell.period + 1}</p>
                <p>Retention: {Math.round(hoveredCell.value)}%</p>
                <p>Users: {hoveredCell.percentage}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      {showDataTable && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border border-border rounded-lg">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Cohort</th>
                <th className="px-4 py-2 text-right">Initial Size</th>
                {Array.from({ 
                  length: processedData.length > 0 
                    ? Math.max(...processedData.map(d => d.retentionRates.length)) 
                    : 0
                }).map((_, period) => (
                  <th key={period} className="px-4 py-2 text-right">Period {period + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.map((cohort) => (
                <tr key={cohort.cohort} className="border-t hover:bg-muted">
                  <td className="px-4 py-2 font-medium">{cohort.cohort}</td>
                  <td className="px-4 py-2 text-right">{cohort.initialSize.toLocaleString()}</td>
                  {cohort.retentionRates.map((rate, periodIndex) => {
                    const percentage = cohort.initialSize > 0 ? (rate / cohort.initialSize) * 100 : 0;
                    return (
                      <td key={periodIndex} className="px-4 py-2 text-right">
                        <span className="block">{rate.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">({Math.round(percentage)}%)</span>
                      </td>
                    );
                  })}
                  {/* Fill empty cells if this cohort has fewer periods */}
                  {Array.from({ 
                    length: Math.max(...processedData.map(d => d.retentionRates.length)) - cohort.retentionRates.length 
                  }).map((_, emptyIndex) => (
                    <td key={`empty-${emptyIndex}`} className="px-4 py-2 text-right text-muted-foreground/50">-</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Statistics */}
      {userTier !== 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-primary/10 rounded-lg">
            <h4 className="font-medium text-primary">Total Initial Users</h4>
            <p className="text-2xl font-bold text-primary">
              {processedData.reduce((sum, cohort) => sum + cohort.initialSize, 0).toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 bg-success/10 rounded-lg">
            <h4 className="font-medium text-success">Avg First Period Retention</h4>
            <p className="text-2xl font-bold text-success">
              {processedData.length > 0 ? (
                Math.round(
                  processedData.reduce((sum, cohort) => {
                    const firstPeriodRate = cohort.retentionRates[0] || 0;
                    return sum + (cohort.initialSize > 0 ? (firstPeriodRate / cohort.initialSize) * 100 : 0);
                  }, 0) / processedData.length
                )
              ) : 0}%
            </p>
          </div>
          
          <div className="p-4 bg-secondary/10 rounded-lg">
            <h4 className="font-medium text-secondary">Best Performing Cohort</h4>
            <p className="text-lg font-bold text-secondary">
              {processedData.length > 0 ? (
                processedData.reduce((best, cohort) => {
                  const avgRetention = cohort.retentionRates.reduce((sum, rate, _i) => {
                    return sum + (cohort.initialSize > 0 ? (rate / cohort.initialSize) * 100 : 0);
                  }, 0) / cohort.retentionRates.length;
                  
                  const bestAvg = best.retentionRates.reduce((sum, rate, _i) => {
                    return sum + (best.initialSize > 0 ? (rate / best.initialSize) * 100 : 0);
                  }, 0) / best.retentionRates.length;
                  
                  return avgRetention > bestAvg ? cohort : best;
                }).cohort
              ) : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CohortAnalysisChart;