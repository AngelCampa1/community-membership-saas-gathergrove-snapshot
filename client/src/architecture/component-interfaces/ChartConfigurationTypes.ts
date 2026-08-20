'use client';

/**
 * ARCHITECTURE DECISION RECORD: Chart Configuration Types
 * 
 * Problem: Chart.js type mismatches in EngagementDashboard
 * - Line vs Bar chart type conflicts in options
 * - Inconsistent chart configuration patterns
 * - Mixed chart type definitions causing compilation errors
 * 
 * Solution: Unified chart configuration types with proper type safety
 */

import { TooltipItem } from'chart.js';

// Base chart configuration interface
export interface BaseChartConfig<T extends'line' |'bar' |'doughnut' |'pie'> {
  type: T;
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position:'top' |'bottom' |'left' |'right';
    };
    tooltip: {
      enabled: boolean;
      mode:'index' |'nearest' |'point' |'dataset';
      intersect: boolean;
      callbacks?: {
        label?: (tooltipItem: TooltipItem<T>) => string;
        title?: (tooltipItems: TooltipItem<T>[]) => string;
      };
    };
  };
  scales?: {
    x?: {
      display: boolean;
      grid: {
        display: boolean;
      };
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      display: boolean;
      grid: {
        display: boolean;
      };
      title?: {
        display: boolean;
        text: string;
      };
      beginAtZero: boolean;
    };
  };
}

// Line chart specific configuration
export interface LineChartConfig extends BaseChartConfig<'line'> {
  elements: {
    point: {
      radius: number;
      hoverRadius: number;
    };
    line: {
      tension: number;
      borderWidth: number;
    };
  };
  interaction: {
    mode:'index';
    intersect: boolean;
  };
}

// Bar chart specific configuration
export interface BarChartConfig extends BaseChartConfig<'bar'> {
  barThickness?: number |'flex';
  maxBarThickness?: number;
  categoryPercentage: number;
  barPercentage: number;
}

// Doughnut chart specific configuration
export interface DoughnutChartConfig extends BaseChartConfig<'doughnut'> {
  cutout: string | number;
  radius: string | number;
  plugins: BaseChartConfig<'doughnut'>['plugins'] & {
    legend: {
      display: boolean;
      position:'top' |'bottom' |'left' |'right';
      labels: {
        usePointStyle: boolean;
        padding: number;
      };
    };
  };
}

// Chart data interfaces
export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface DoughnutChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Chart theme configurations
export const chartThemes = {
  default: {
    primary:'#3b82f6',
    secondary:'#10b981',
    accent:'#f59e0b',
    danger:'#ef4444',
    warning:'#f97316',
    info:'#06b6d4',
    success:'#22c55e',
    muted:'#6b7280',
  },
} as const;

// Default configurations factory functions
export const createLineChartConfig = (
  options: Partial<LineChartConfig> = {}
): LineChartConfig => ({
  type:'line',
  responsive: true,
  maintainAspectRatio: false,
  elements: {
    point: {
      radius: 4,
      hoverRadius: 8,
    },
    line: {
      tension: 0.2,
      borderWidth: 2,
    },
  },
  interaction: {
    mode:'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position:'top',
    },
    tooltip: {
      enabled: true,
      mode:'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true,
      },
    },
    y: {
      display: true,
      grid: {
        display: true,
      },
      beginAtZero: true,
    },
  },
  ...options,
});

export const createBarChartConfig = (
  options: Partial<BarChartConfig> = {}
): BarChartConfig => ({
  type:'bar',
  responsive: true,
  maintainAspectRatio: false,
  categoryPercentage: 0.8,
  barPercentage: 0.9,
  plugins: {
    legend: {
      display: true,
      position:'top',
    },
    tooltip: {
      enabled: true,
      mode:'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false,
      },
    },
    y: {
      display: true,
      grid: {
        display: true,
      },
      beginAtZero: true,
    },
  },
  ...options,
});

export const createDoughnutChartConfig = (
  options: Partial<DoughnutChartConfig> = {}
): DoughnutChartConfig => ({
  type:'doughnut',
  responsive: true,
  maintainAspectRatio: false,
  cutout:'60%',
  radius:'100%',
  plugins: {
    legend: {
      display: true,
      position:'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      enabled: true,
      mode:'point',
      intersect: true,
    },
  },
  ...options,
});

// Chart data factory functions
export const createLineChartData = (
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
    fill?: boolean;
  }>,
  theme: keyof typeof chartThemes ='default'
): LineChartData => ({
  labels,
  datasets: datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    borderColor: dataset.color || Object.values(chartThemes[theme])[index % Object.values(chartThemes[theme]).length],
    backgroundColor: (dataset.color || Object.values(chartThemes[theme])[index % Object.values(chartThemes[theme]).length]) +'20',
    tension: 0.2,
    fill: dataset.fill ?? false,
  })),
});

export const createBarChartData = (
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
    colors?: string[];
  }>,
  theme: keyof typeof chartThemes ='default'
): BarChartData => ({
  labels,
  datasets: datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.colors || [Object.values(chartThemes[theme])[index % Object.values(chartThemes[theme]).length]],
    borderColor: dataset.colors?.map(color => color +'CC') || [Object.values(chartThemes[theme])[index % Object.values(chartThemes[theme]).length] +'CC'],
    borderWidth: 1,
  })),
});

export const createDoughnutChartData = (
  labels: string[],
  data: number[],
  colors?: string[],
  theme: keyof typeof chartThemes ='default'
): DoughnutChartData => ({
  labels,
  datasets: [{
    label:'Distribution',
    data,
    backgroundColor: colors || labels.map((_, index) => 
      Object.values(chartThemes[theme])[index % Object.values(chartThemes[theme]).length]
    ),
    borderColor: colors?.map(color => color +'CC') || labels.map((_, index) => 
      Object.values(chartThemes[theme])[index % Object.values(chartThemes[theme]).length] +'CC'
    ),
    borderWidth: 1,
  }],
});

// Chart utility functions
export const chartUtils = {
  formatTooltipValue: (value: number, suffix: string =''): string => 
    `${value.toLocaleString()}${suffix}`,
  
  formatPercentage: (value: number): string => 
    `${value.toFixed(1)}%`,
  
  generateColors: (count: number, theme: keyof typeof chartThemes ='default'): string[] => {
    const themeColors = Object.values(chartThemes[theme]);
    return Array.from({ length: count }, (_, index) => 
      themeColors[index % themeColors.length]
    );
  },
  
  addTransparency: (color: string, opacity: string ='20'): string => 
    color + opacity,
};

// Type-safe chart component props
export interface ChartComponentProps<T extends'line' |'bar' |'doughnut'> {
  data: T extends'line' ? LineChartData : T extends'bar' ? BarChartData : DoughnutChartData;
  config: T extends'line' ? LineChartConfig : T extends'bar' ? BarChartConfig : DoughnutChartConfig;
  height?: number;
  width?: number;
  className?: string;
  theme?: keyof typeof chartThemes;
}