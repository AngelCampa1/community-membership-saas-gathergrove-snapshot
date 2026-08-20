/**
 * ChartColors Tests - Full Coverage
 */

import {
  CHART_COLORS,
  CHART_COLOR_ARRAY,
  CHART_COLOR_EXTENDED,
  CHART_SEMANTIC,
  CHART_GRADIENTS,
  CHART_BACKGROUNDS,
  RATING_COLORS,
  HEATMAP_SCALE,
  COHORT_PALETTES,
  COHORT_FALLBACK_COLORS,
  STATUS_COLORS,
  GLASSMORPHISM,
  CHART_BORDERS,
  TEXT_ON_COLOR,
  RECHARTS_COLORS,
  getChartColor,
  getChartColors,
  withOpacity,
  getDatasetColors,
} from '../chartColors';

describe('ChartColors', () => {
  describe('Constants', () => {
    it('should export CHART_COLORS with all color keys', () => {
      expect(CHART_COLORS).toHaveProperty('primary');
      expect(CHART_COLORS).toHaveProperty('blue');
      expect(CHART_COLORS).toHaveProperty('amber');
      expect(CHART_COLORS).toHaveProperty('red');
      expect(CHART_COLORS).toHaveProperty('purple');
      expect(CHART_COLORS).toHaveProperty('cyan');
      expect(CHART_COLORS).toHaveProperty('pink');
      expect(CHART_COLORS).toHaveProperty('teal');
    });

    it('should export CHART_COLOR_ARRAY with 8 colors', () => {
      expect(CHART_COLOR_ARRAY).toHaveLength(8);
      expect(CHART_COLOR_ARRAY[0]).toBe('#4a9a72');
      expect(CHART_COLOR_ARRAY[7]).toBe('#14b8a6');
    });

    it('should export CHART_COLOR_EXTENDED with 12 colors', () => {
      expect(CHART_COLOR_EXTENDED).toHaveLength(12);
      expect(CHART_COLOR_EXTENDED[0]).toBe('#4a9a72');
      expect(CHART_COLOR_EXTENDED[11]).toBe('#a855f7');
    });

    it('should export CHART_SEMANTIC with semantic color keys', () => {
      expect(CHART_SEMANTIC).toHaveProperty('positive');
      expect(CHART_SEMANTIC).toHaveProperty('negative');
      expect(CHART_SEMANTIC).toHaveProperty('neutral');
      expect(CHART_SEMANTIC).toHaveProperty('warning');
      expect(CHART_SEMANTIC).toHaveProperty('info');
    });

    it('should export CHART_GRADIENTS with gradient pairs', () => {
      expect(CHART_GRADIENTS.primary).toHaveLength(2);
      expect(CHART_GRADIENTS.blue).toHaveLength(2);
      expect(CHART_GRADIENTS.amber).toHaveLength(2);
      expect(CHART_GRADIENTS.red).toHaveLength(2);
      expect(CHART_GRADIENTS.purple).toHaveLength(2);
      expect(CHART_GRADIENTS.success).toHaveLength(2);
    });

    it('should export CHART_BACKGROUNDS with opacity variants', () => {
      expect(CHART_BACKGROUNDS).toHaveProperty('primary');
      expect(CHART_BACKGROUNDS).toHaveProperty('blue');
      expect(CHART_BACKGROUNDS).toHaveProperty('amber');
      expect(CHART_BACKGROUNDS).toHaveProperty('red');
      expect(CHART_BACKGROUNDS).toHaveProperty('purple');
      expect(CHART_BACKGROUNDS).toHaveProperty('success');
    });

    it('should export RATING_COLORS with 1-5 ratings', () => {
      expect(RATING_COLORS[1]).toBe('#ef4444');
      expect(RATING_COLORS[2]).toBe('#f97316');
      expect(RATING_COLORS[3]).toBe('#f59e0b');
      expect(RATING_COLORS[4]).toBe('#84cc16');
      expect(RATING_COLORS[5]).toBe('#16a149');
    });

    it('should export HEATMAP_SCALE with 11 levels (0-100)', () => {
      expect(HEATMAP_SCALE[0]).toBe('#f8faf9');
      expect(HEATMAP_SCALE[50]).toBe('#64bd8c');
      expect(HEATMAP_SCALE[100]).toBe('#1a3a2d');
    });

    it('should export COHORT_PALETTES with 4 palette types', () => {
      expect(COHORT_PALETTES.blue).toHaveLength(8);
      expect(COHORT_PALETTES.green).toHaveLength(8);
      expect(COHORT_PALETTES.purple).toHaveLength(8);
      expect(COHORT_PALETTES.primary).toHaveLength(8);
    });

    it('should export COHORT_FALLBACK_COLORS with 5 colors', () => {
      expect(COHORT_FALLBACK_COLORS).toHaveLength(5);
      expect(COHORT_FALLBACK_COLORS[0]).toBe('#e3ece8');
    });

    it('should export STATUS_COLORS with all status keys', () => {
      expect(STATUS_COLORS).toHaveProperty('active');
      expect(STATUS_COLORS).toHaveProperty('pending');
      expect(STATUS_COLORS).toHaveProperty('inactive');
      expect(STATUS_COLORS).toHaveProperty('error');
      expect(STATUS_COLORS).toHaveProperty('success');
      expect(STATUS_COLORS).toHaveProperty('warning');
      expect(STATUS_COLORS).toHaveProperty('info');
    });

    it('should export GLASSMORPHISM with light mode and overlay', () => {
      expect(GLASSMORPHISM.light).toHaveProperty('background');
      expect(GLASSMORPHISM).toHaveProperty('overlay');
    });

    it('should export CHART_BORDERS with border color variants', () => {
      expect(CHART_BORDERS).toHaveProperty('primary');
      expect(CHART_BORDERS).toHaveProperty('blue');
      expect(CHART_BORDERS).toHaveProperty('amber');
      expect(CHART_BORDERS).toHaveProperty('red');
      expect(CHART_BORDERS).toHaveProperty('purple');
      expect(CHART_BORDERS).toHaveProperty('success');
    });

    it('should export TEXT_ON_COLOR with light and inverse variants', () => {
      expect(TEXT_ON_COLOR.light).toBe('#ffffff');
      expect(TEXT_ON_COLOR.inverse).toBe('#000000');
    });

    it('should export RECHARTS_COLORS equal to CHART_COLOR_ARRAY', () => {
      expect(RECHARTS_COLORS).toEqual(CHART_COLOR_ARRAY);
    });
  });

  describe('getChartColor', () => {
    it('should return first color for index 0', () => {
      expect(getChartColor(0)).toBe('#4a9a72');
    });

    it('should return last color for index 7', () => {
      expect(getChartColor(7)).toBe('#14b8a6');
    });

    it('should cycle back to first color for index 8', () => {
      expect(getChartColor(8)).toBe('#4a9a72');
    });

    it('should cycle back to second color for index 9', () => {
      expect(getChartColor(9)).toBe('#3b82f6');
    });

    it('should handle large indices by cycling', () => {
      expect(getChartColor(16)).toBe('#4a9a72');
      expect(getChartColor(100)).toBe(CHART_COLOR_ARRAY[100 % 8]);
    });

    it('should return different colors for sequential indices', () => {
      const color0 = getChartColor(0);
      const color1 = getChartColor(1);
      const color2 = getChartColor(2);
      expect(color0).not.toBe(color1);
      expect(color1).not.toBe(color2);
    });

    it('should return a valid hex color string', () => {
      const color = getChartColor(0);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getChartColors', () => {
    it('should return empty array for count 0', () => {
      expect(getChartColors(0)).toEqual([]);
    });

    it('should return single color for count 1', () => {
      const result = getChartColors(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('#4a9a72');
    });

    it('should return correct number of colors for count 5', () => {
      const result = getChartColors(5);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('#4a9a72');
    });

    it('should return correct number of colors for count 8', () => {
      const result = getChartColors(8);
      expect(result).toHaveLength(8);
    });

    it('should cycle colors for count greater than array length', () => {
      const len = CHART_COLOR_ARRAY.length;
      const result = getChartColors(len + 2);
      expect(result).toHaveLength(len + 2);
      expect(result[len]).toBe(result[0]); // Cycles back
      expect(result[len + 1]).toBe(result[1]);
    });

    it('should handle large counts', () => {
      const result = getChartColors(20);
      expect(result).toHaveLength(20);
    });
  });

  describe('withOpacity', () => {
    it('should convert hex color to rgba with opacity', () => {
      const result = withOpacity('#4a9a72', 0.5);
      expect(result).toBe('rgba(74, 154, 114, 0.5)');
    });

    it('should handle full opacity', () => {
      const result = withOpacity('#3b82f6', 1.0);
      expect(result).toBe('rgba(59, 130, 246, 1)');
    });

    it('should handle zero opacity', () => {
      const result = withOpacity('#ef4444', 0);
      expect(result).toBe('rgba(239, 68, 68, 0)');
    });

    it('should convert lowercase hex to rgba', () => {
      const result = withOpacity('#abc123', 0.7);
      expect(result).toBe('rgba(171, 193, 35, 0.7)');
    });

    it('should handle rgb color by converting to rgba', () => {
      const result = withOpacity('rgb(74, 154, 114)', 0.5);
      expect(result).toBe('rgba(74, 154, 114, 0.5)');
    });

    it('should return original color if not hex or rgb', () => {
      const color = 'hsl(120, 50%, 50%)';
      const result = withOpacity(color, 0.5);
      expect(result).toBe(color);
    });

    it('should handle partial opacity values', () => {
      const result = withOpacity('#ffffff', 0.1);
      expect(result).toBe('rgba(255, 255, 255, 0.1)');
    });
  });

  describe('getDatasetColors', () => {
    it('should return dataset colors for index 0', () => {
      const result = getDatasetColors(0);

      expect(result).toHaveProperty('borderColor', '#4a9a72');
      expect(result).toHaveProperty('backgroundColor', 'rgba(74, 154, 114, 0.1)');
      expect(result).toHaveProperty('pointBackgroundColor', '#4a9a72');
      expect(result).toHaveProperty('pointBorderColor', '#ffffff');
    });

    it('should return dataset colors for index 1 (cycles by array length)', () => {
      const result = getDatasetColors(1);
      const expectedColor = getChartColor(1);

      expect(result.borderColor).toBe(expectedColor);
      expect(result.pointBackgroundColor).toBe(expectedColor);
    });

    it('should cycle colors for index >= array length', () => {
      const len = CHART_COLOR_ARRAY.length;
      const result = getDatasetColors(len);

      expect(result.borderColor).toBe('#4a9a72'); // Cycles back to first color
      expect(result.backgroundColor).toBe('rgba(74, 154, 114, 0.1)');
    });

    it('should always use white for point border color', () => {
      const result0 = getDatasetColors(0);
      const result5 = getDatasetColors(5);
      const result10 = getDatasetColors(10);

      expect(result0.pointBorderColor).toBe('#ffffff');
      expect(result5.pointBorderColor).toBe('#ffffff');
      expect(result10.pointBorderColor).toBe('#ffffff');
    });

    it('should use 10% opacity for background color', () => {
      const result = getDatasetColors(3);

      expect(result.backgroundColor).toContain('0.1)');
    });

    it('should return consistent structure for any index', () => {
      const result0 = getDatasetColors(0);
      const result1 = getDatasetColors(1);

      expect(result0).toHaveProperty('borderColor');
      expect(result0).toHaveProperty('backgroundColor');
      expect(result0).toHaveProperty('pointBackgroundColor');
      expect(result0).toHaveProperty('pointBorderColor');
      expect(result1).toHaveProperty('borderColor');
    });
  });

  describe('Color Palette Integration', () => {
    it('should have consistent primary color across palettes', () => {
      expect(CHART_COLORS.primary).toContain('primary');
      expect(CHART_COLOR_ARRAY[0]).toBe('#4a9a72');
      expect(CHART_GRADIENTS.primary[0]).toBe('#4a9a72');
    });

    it('should have semantic colors for positive/negative', () => {
      expect(CHART_SEMANTIC.positive).toBeDefined();
      expect(CHART_SEMANTIC.negative).toBeDefined();
      expect(CHART_SEMANTIC.positive).not.toBe(CHART_SEMANTIC.negative);
    });

    it('should have glassmorphism values for light mode', () => {
      expect(GLASSMORPHISM.light.background).toContain('rgba');
      expect(GLASSMORPHISM.overlay).toContain('rgba');
    });

    it('should have cohort palettes with 8 shades each', () => {
      Object.values(COHORT_PALETTES).forEach(palette => {
        expect(palette).toHaveLength(8);
      });
    });
  });
});
