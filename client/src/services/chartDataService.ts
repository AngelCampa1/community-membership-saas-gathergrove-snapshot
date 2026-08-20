import { format, parseISO, startOfWeek, startOfMonth, eachWeekOfInterval, eachMonthOfInterval, eachDayOfInterval } from 'date-fns';
import {
  EngagementMetric,
  ROIMetric,
  EventPerformanceData
} from '@/types/analytics';

// Enhanced chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  data: ChartDataPoint[];
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  seasonality?: {
    detected: boolean;
    pattern?: 'weekly' | 'monthly' | 'quarterly';
    strength: number;
  };
}

export interface CorrelationAnalysis {
  metricA: string;
  metricB: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  significance: number;
  interpretation: string;
}

export interface AnomalyDetection {
  dataPoint: ChartDataPoint;
  anomalyType: 'spike' | 'drop' | 'outlier';
  severity: 'low' | 'medium' | 'high';
  expectedValue: number;
  deviation: number;
  possibleCauses: string[];
}

export interface ForecastData {
  historical: ChartDataPoint[];
  forecast: ChartDataPoint[];
  confidenceInterval: {
    upper: ChartDataPoint[];
    lower: ChartDataPoint[];
  };
  accuracy: number;
  method: 'linear' | 'exponential' | 'seasonal' | 'arima';
}

export interface SegmentationData {
  segment: string;
  data: ChartDataPoint[];
  size: number;
  characteristics: Record<string, unknown>;
  performance: {
    rank: number;
    percentile: number;
    compared_to_average: number;
  };
}

/**
 * Chart Data Service - Advanced data transformation and analytics
 * Provides data processing, forecasting, and analytical insights
 */
class ChartDataService {
  /**
   * Normalize data to consistent time intervals
   */
  normalizeTimeSeries(
    data: Array<{ date: string | Date; value?: number; [key: string]: unknown }>,
    interval: 'daily' | 'weekly' | 'monthly',
    fillGaps: boolean = true,
    valueKey: string = 'value'
  ): ChartDataPoint[] {
    if (!data || data.length === 0) return [];

    // Sort data by date
    const sortedData = data.map(item => ({
      ...item,
      timestamp: typeof item.date === 'string' ? parseISO(item.date) : item.date
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // SECURITY FIX: Validate sortedData has elements before accessing indices
    if (sortedData.length === 0) {
      return [];
    }

    const startDate = sortedData[0].timestamp;
    const endDate = sortedData[sortedData.length - 1].timestamp;

    let intervals: Date[];
    
    switch (interval) {
      case 'daily':
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case 'weekly':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
      default:
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    return intervals.map(intervalDate => {
      // Find data point for this interval
      const dataPoint = sortedData.find(item => {
        switch (interval) {
          case 'daily':
            return format(item.timestamp, 'yyyy-MM-dd') === format(intervalDate, 'yyyy-MM-dd');
          case 'weekly':
            return startOfWeek(item.timestamp).getTime() === startOfWeek(intervalDate).getTime();
          case 'monthly':
            return startOfMonth(item.timestamp).getTime() === startOfMonth(intervalDate).getTime();
          default:
            return false;
        }
      });

      const valueAtKey = dataPoint ? (dataPoint as Record<string, unknown>)[valueKey] : undefined;
      return {
        label: format(intervalDate, interval === 'daily' ? 'MMM dd' : interval === 'weekly' ? 'MMM dd' : 'MMM yyyy'),
        value: (dataPoint && typeof valueAtKey === 'number') ? valueAtKey : (fillGaps ? 0 : null),
        timestamp: intervalDate,
        metadata: dataPoint ? { ...dataPoint } : undefined
      };
    }).filter(point => point.value !== null) as ChartDataPoint[];
  }

  /**
   * Calculate moving averages for trend analysis
   */
  calculateMovingAverage(
    data: ChartDataPoint[],
    window: number,
    type: 'simple' | 'exponential' | 'weighted' = 'simple'
  ): ChartDataPoint[] {
    if (data.length < window) return [];

    const result: ChartDataPoint[] = [];

    for (let i = window - 1; i < data.length; i++) {
      let average: number;
      
      switch (type) {
        case 'simple':
          average = data.slice(i - window + 1, i + 1)
            .reduce((sum, point) => sum + point.value, 0) / window;
          break;
          
        case 'exponential':
          const _alpha = 2 / (window + 1);
          average = data[i].value;
          for (let j = i - 1; j >= Math.max(0, i - window + 1); j--) {
            average = _alpha * data[j].value + (1 - _alpha) * average;
          }
          break;
          
        case 'weighted':
          let weightedSum = 0;
          let weightSum = 0;
          for (let j = i - window + 1; j <= i; j++) {
            const weight = j - (i - window) + 1;
            weightedSum += data[j].value * weight;
            weightSum += weight;
          }
          average = weightedSum / weightSum;
          break;
          
        default:
          average = data[i].value;
      }

      result.push({
        label: data[i].label,
        value: average,
        timestamp: data[i].timestamp,
        metadata: { originalValue: data[i].value, movingAverage: average }
      });
    }

    return result;
  }

  /**
   * Detect trends in time series data
   */
  analyzeTrend(data: ChartDataPoint[]): TimeSeriesData {
    if (data.length < 2) {
      return {
        data,
        trend: 'stable',
        growthRate: 0
      };
    }

    // Calculate linear regression for trend
    const n = data.length;
    const xValues = data.map((_, i) => i);
    const yValues = data.map(point => point.value);
    
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    const slope = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0) /
                  xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);

    // Calculate growth rate
    const firstValue = yValues[0];
    const lastValue = yValues[n - 1];
    const growthRate = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Determine trend direction
    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(slope) < 0.1) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    // Detect seasonality (basic implementation)
    const seasonality = this.detectSeasonality(data);

    return {
      data,
      trend,
      growthRate: Number(growthRate.toFixed(2)),
      seasonality
    };
  }

  /**
   * Basic seasonality detection
   */
  private detectSeasonality(data: ChartDataPoint[]): {
    detected: boolean;
    pattern?: 'weekly' | 'monthly' | 'quarterly';
    strength: number;
  } {
    if (data.length < 12) {
      return { detected: false, strength: 0 };
    }

    // Simple autocorrelation check for common patterns
    const values = data.map(d => d.value);
    const patterns = [
      { lag: 7, type: 'weekly' as const },
      { lag: 30, type: 'monthly' as const },
      { lag: 90, type: 'quarterly' as const }
    ];

    let bestPattern: { pattern: 'weekly' | 'monthly' | 'quarterly'; strength: number } | null = null;

    for (const { lag, type } of patterns) {
      if (values.length > lag * 2) {
        const correlation = this.calculateAutocorrelation(values, lag);
        if (correlation > 0.3 && (!bestPattern || correlation > bestPattern.strength)) {
          bestPattern = { pattern: type, strength: correlation };
        }
      }
    }

    return {
      detected: bestPattern !== null,
      pattern: bestPattern?.pattern,
      strength: bestPattern?.strength || 0
    };
  }

  /**
   * Calculate autocorrelation for seasonality detection
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;

    const n = values.length - lag;
    const mean1 = values.slice(0, n).reduce((sum, v) => sum + v, 0) / n;
    const mean2 = values.slice(lag).reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
      const dev1 = values[i] - mean1;
      const dev2 = values[i + lag] - mean2;
      numerator += dev1 * dev2;
      denominator1 += dev1 ** 2;
      denominator2 += dev2 ** 2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Detect anomalies in data using statistical methods
   */
  detectAnomalies(
    data: ChartDataPoint[],
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): AnomalyDetection[] {
    if (data.length < 10) return [];

    const values = data.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );

    const thresholds = {
      low: 3,
      medium: 2.5,
      high: 2
    };

    const threshold = thresholds[sensitivity];
    const anomalies: AnomalyDetection[] = [];

    data.forEach((point, _index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      
      if (zScore > threshold) {
        const deviation = ((point.value - mean) / mean) * 100;
        
        anomalies.push({
          dataPoint: point,
          anomalyType: point.value > mean ? 'spike' : 'drop',
          severity: zScore > threshold * 1.5 ? 'high' : zScore > threshold * 1.2 ? 'medium' : 'low',
          expectedValue: mean,
          deviation: Number(deviation.toFixed(2)),
          possibleCauses: this.generateAnomalyCauses(point, deviation, _index)
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate possible causes for anomalies
   */
  private generateAnomalyCauses(
    point: ChartDataPoint,
    deviation: number,
    _index: number
  ): string[] {
    const causes: string[] = [];

    if (deviation > 0) {
      causes.push('Successful marketing campaign');
      causes.push('Special event or promotion');
      causes.push('Viral content or media coverage');
      causes.push('Product launch or feature release');
    } else {
      causes.push('Technical issues or downtime');
      causes.push('Competitor activity');
      causes.push('Seasonal decline');
      causes.push('External market factors');
    }

    // Add day-specific causes based on timestamp
    if (point.timestamp) {
      const dayOfWeek = point.timestamp.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        causes.push('Weekend effect');
      }
    }

    return causes.slice(0, 3); // Return top 3 most likely causes
  }

  /**
   * Calculate correlation between metrics
   */
  calculateCorrelation(
    dataA: ChartDataPoint[],
    dataB: ChartDataPoint[],
    metricAName: string,
    metricBName: string
  ): CorrelationAnalysis {
    const minLength = Math.min(dataA.length, dataB.length);
    const valuesA = dataA.slice(0, minLength).map(d => d.value);
    const valuesB = dataB.slice(0, minLength).map(d => d.value);

    if (minLength < 3) {
      return {
        metricA: metricAName,
        metricB: metricBName,
        correlation: 0,
        strength: 'weak',
        significance: 0,
        interpretation: 'Insufficient data for correlation analysis'
      };
    }

    const meanA = valuesA.reduce((sum, v) => sum + v, 0) / minLength;
    const meanB = valuesB.reduce((sum, v) => sum + v, 0) / minLength;

    let numerator = 0;
    let denominatorA = 0;
    let denominatorB = 0;

    for (let i = 0; i < minLength; i++) {
      const devA = valuesA[i] - meanA;
      const devB = valuesB[i] - meanB;
      numerator += devA * devB;
      denominatorA += devA ** 2;
      denominatorB += devB ** 2;
    }

    const denominator = Math.sqrt(denominatorA * denominatorB);
    const correlation = denominator === 0 ? 0 : numerator / denominator;

    // Determine strength
    const absCorr = Math.abs(correlation);
    let strength: 'weak' | 'moderate' | 'strong';
    if (absCorr < 0.3) strength = 'weak';
    else if (absCorr < 0.7) strength = 'moderate';
    else strength = 'strong';

    // Calculate significance (simplified)
    const tStat = correlation * Math.sqrt((minLength - 2) / (1 - correlation ** 2));
    const significance = Math.min(Math.abs(tStat) / 2, 1); // Simplified p-value approximation

    // Generate interpretation
    let interpretation = '';
    if (strength === 'weak') {
      interpretation = `Weak ${correlation > 0 ? 'positive' : 'negative'} relationship between ${metricAName} and ${metricBName}`;
    } else if (strength === 'moderate') {
      interpretation = `Moderate ${correlation > 0 ? 'positive' : 'negative'} relationship - changes in ${metricAName} tend to ${correlation > 0 ? 'align with' : 'oppose'} changes in ${metricBName}`;
    } else {
      interpretation = `Strong ${correlation > 0 ? 'positive' : 'negative'} relationship - ${metricAName} and ${metricBName} are highly ${correlation > 0 ? 'correlated' : 'negatively correlated'}`;
    }

    return {
      metricA: metricAName,
      metricB: metricBName,
      correlation: Number(correlation.toFixed(3)),
      strength,
      significance: Number(significance.toFixed(3)),
      interpretation
    };
  }

  /**
   * Generate simple forecast using linear regression
   */
  generateForecast(
    data: ChartDataPoint[],
    periodsAhead: number,
    method: 'linear' | 'exponential' = 'linear'
  ): ForecastData {
    if (data.length < 3) {
      return {
        historical: data,
        forecast: [],
        confidenceInterval: { upper: [], lower: [] },
        accuracy: 0,
        method
      };
    }

    const values = data.map(d => d.value);
    const n = values.length;

    let forecast: ChartDataPoint[];
    let accuracy: number;
    let slope = 0;
    let intercept = 0;

    if (method === 'linear') {
      // Linear regression forecast
      const xValues = Array.from({ length: n }, (_, i) => i);
      const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
      const yMean = values.reduce((sum, y) => sum + y, 0) / n;

      slope = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0) /
              xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
      intercept = yMean - slope * xMean;

      // Calculate accuracy (R-squared)
      const predictedValues = xValues.map(x => slope * x + intercept);
      const totalSumSquares = values.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
      const residualSumSquares = values.reduce((sum, y, i) => sum + (y - predictedValues[i]) ** 2, 0);
      accuracy = Math.max(0, 1 - residualSumSquares / totalSumSquares);

      // Generate forecast points
      forecast = Array.from({ length: periodsAhead }, (_, i) => {
        const x = n + i;
        const predictedValue = slope * x + intercept;
        const forecastDate = new Date(data[n - 1].timestamp);
        forecastDate.setDate(forecastDate.getDate() + (i + 1));

        return {
          label: format(forecastDate, 'MMM dd'),
          value: Math.max(0, predictedValue), // Ensure non-negative values
          timestamp: forecastDate,
          metadata: { forecasted: true, method: 'linear' }
        };
      });
    } else {
      // Exponential forecast (simplified exponential smoothing)
      const _alpha = 0.3; // Smoothing parameter
      const lastValue = values[n - 1];
      const trend = values[n - 1] - values[n - 2];

      forecast = Array.from({ length: periodsAhead }, (_, i) => {
        const predictedValue = lastValue + trend * (i + 1);
        const forecastDate = new Date(data[n - 1].timestamp);
        forecastDate.setDate(forecastDate.getDate() + (i + 1));

        return {
          label: format(forecastDate, 'MMM dd'),
          value: Math.max(0, predictedValue),
          timestamp: forecastDate,
          metadata: { forecasted: true, method: 'exponential' }
        };
      });

      // Simple accuracy calculation for exponential
      accuracy = 0.7; // Placeholder - would need more sophisticated calculation
    }

    // Calculate confidence intervals (simplified)
    const stdError = Math.sqrt(
      values.reduce((sum, v, i) => {
        const predicted = method === 'linear' 
          ? (n > 1 ? slope * i + intercept : v)
          : v;
        return sum + (v - predicted) ** 2;
      }, 0) / Math.max(1, n - 2)
    );

    const confidenceInterval = {
      upper: forecast.map(point => ({
        ...point,
        value: point.value + 1.96 * stdError,
        metadata: { ...point.metadata, confidenceLevel: 'upper' }
      })),
      lower: forecast.map(point => ({
        ...point,
        value: Math.max(0, point.value - 1.96 * stdError),
        metadata: { ...point.metadata, confidenceLevel: 'lower' }
      }))
    };

    return {
      historical: data,
      forecast,
      confidenceInterval,
      accuracy: Number(accuracy.toFixed(3)),
      method
    };
  }

  /**
   * Segment data based on criteria
   */
  segmentData(
    data: Array<Record<string, unknown>>,
    segmentField: string,
    valueField: string,
    dateField: string = 'date'
  ): SegmentationData[] {
    if (!data || data.length === 0) return [];

    // Group data by segment
    const segments = data.reduce((acc: Record<string, Record<string, unknown>[]>, item: Record<string, unknown>) => {
      const segmentKey = (item[segmentField] as string) || 'Unknown';
      if (!acc[segmentKey]) {
        acc[segmentKey] = [];
      }
      acc[segmentKey].push(item);
      return acc;
    }, {} as Record<string, Record<string, unknown>[]>);

    // Calculate performance metrics
    const segmentPerformance = (Object.entries(segments) as [string, Record<string, unknown>[]][]).map(([segment, items]) => {
      const segmentData: ChartDataPoint[] = items
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const dateA = typeof a[dateField] === 'string' ? a[dateField] : String(a[dateField]);
          const dateB = typeof b[dateField] === 'string' ? b[dateField] : String(b[dateField]);
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        })
        .map((item: Record<string, unknown>) => {
          const dateValue = typeof item[dateField] === 'string' ? item[dateField] : String(item[dateField]);
          const numericValue = typeof item[valueField] === 'number' ? item[valueField] : Number(item[valueField]) || 0;
          return {
            label: format(parseISO(dateValue), 'MMM dd'),
            value: numericValue,
            timestamp: parseISO(dateValue),
            metadata: item
          };
        });

      const totalValue = segmentData.reduce((sum, point) => sum + point.value, 0);
      const avgValue = totalValue / segmentData.length;

      return {
        segment,
        data: segmentData,
        size: items.length,
        avgValue,
        totalValue
      };
    }).sort((a, b) => b.avgValue - a.avgValue);

    // Assign ranks and percentiles
    const overallAvg = segmentPerformance.reduce((sum, seg) => sum + seg.avgValue, 0) / segmentPerformance.length;

    return segmentPerformance.map((seg, _index) => ({
      segment: seg.segment,
      data: seg.data,
      size: seg.size,
      characteristics: {
        totalValue: seg.totalValue,
        averageValue: seg.avgValue,
        dataPoints: seg.size
      },
      performance: {
        rank: _index + 1,
        percentile: Math.round(((segmentPerformance.length - _index) / segmentPerformance.length) * 100),
        compared_to_average: Number(((seg.avgValue - overallAvg) / overallAvg * 100).toFixed(1))
      }
    }));
  }

  /**
   * Transform engagement data for charts
   */
  transformEngagementData(
    data: EngagementMetric[],
    options: {
      normalize?: boolean;
      includeMovingAverage?: boolean;
      movingAverageWindow?: number;
    } = {}
  ): ChartDataPoint[] {
    if (!data || data.length === 0) return [];

    let chartData: ChartDataPoint[] = data.map(item => ({
      label: format(parseISO(item.date), 'MMM dd'),
      value: options.normalize 
        ? (item.engagementRate * 100) 
        : item.activeMembers,
      timestamp: parseISO(item.date),
      metadata: {
        activeMembers: item.activeMembers,
        eventAttendance: item.eventAttendance,
        engagementRate: item.engagementRate,
        totalMembers: item.totalMembers
      }
    }));

    if (options.includeMovingAverage) {
      const window = options.movingAverageWindow || 7;
      chartData = this.calculateMovingAverage(chartData, window);
    }

    return chartData;
  }

  /**
   * Transform ROI data for charts
   */
  transformROIData(data: ROIMetric[]): ChartDataPoint[] {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      label: format(parseISO(item.period), 'MMM yyyy'),
      value: item.roi,
      timestamp: parseISO(item.period),
      metadata: {
        revenue: item.revenue,
        costs: item.costs,
        profit: item.profit,
        trend: item.trend
      }
    }));
  }

  /**
   * Transform event data for performance comparison
   */
  transformEventData(data: EventPerformanceData[]): ChartDataPoint[] {
    if (!data || data.length === 0) return [];

    return data.map(event => ({
      label: event.eventName,
      value: event.attendanceRate,
      timestamp: parseISO(event.date),
      metadata: {
        eventId: event.eventId,
        attendance: event.attendance,
        revenue: event.revenue,
        satisfaction: event.satisfaction,
        capacity: event.capacity
      }
    }));
  }
}

// Export singleton instance
const chartDataService = new ChartDataService();
export default chartDataService;
