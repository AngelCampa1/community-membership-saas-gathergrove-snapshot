import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorSchemePicker } from '../../../client/src/components/branding/ColorSchemePicker';

// Mock color utilities
jest.mock('../../../client/src/utils/colorUtils', () => ({
  isValidHexColor: jest.fn((color: string) => /^#[0-9A-F]{6}$/i.test(color)),
  getContrastRatio: jest.fn(() => 4.5),
  generateColorPalette: jest.fn(() => ({
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  })),
  hexToHsl: jest.fn(() => ({ h: 220, s: 91, l: 60 })),
  hslToHex: jest.fn(() => '#3B82F6')
}));

describe('ColorSchemePicker', () => {
  const mockOnColorChange = jest.fn();
  const mockOnSchemeChange = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    onColorChange: mockOnColorChange,
    onSchemeChange: mockOnSchemeChange,
    onError: mockOnError,
    presetSchemes: [
      {
        id: 'blue',
        name: 'Blue Ocean',
        primary: '#3B82F6',
        secondary: '#1E40AF',
        description: 'Professional blue theme'
      },
      {
        id: 'purple',
        name: 'Purple Galaxy',
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        description: 'Creative purple theme'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders color picker controls', () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/secondary color/i)).toBeInTheDocument();
    });

    it('displays current color values', () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByDisplayValue('#3B82F6');
      const secondaryInput = screen.getByDisplayValue('#8B5CF6');
      
      expect(primaryInput).toBeInTheDocument();
      expect(secondaryInput).toBeInTheDocument();
    });

    it('renders preset color schemes', () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      expect(screen.getByText('Blue Ocean')).toBeInTheDocument();
      expect(screen.getByText('Purple Galaxy')).toBeInTheDocument();
      expect(screen.getByText('Professional blue theme')).toBeInTheDocument();
    });

    it('shows color previews for each preset', () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const presetItems = screen.getAllByRole('button', { name: /apply.*scheme/i });
      expect(presetItems).toHaveLength(2);
      
      presetItems.forEach(item => {
        const colorPreview = item.querySelector('[data-testid="color-preview"]');
        expect(colorPreview).toBeInTheDocument();
      });
    });
  });

  describe('Color Input Functionality', () => {
    it('updates primary color when input changes', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, '#FF5722');
      
      fireEvent.blur(primaryInput);
      
      expect(mockOnColorChange).toHaveBeenCalledWith({
        primary: '#FF5722',
        secondary: '#8B5CF6'
      });
    });

    it('updates secondary color when input changes', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const secondaryInput = screen.getByLabelText(/secondary color/i);
      await userEvent.clear(secondaryInput);
      await userEvent.type(secondaryInput, '#4CAF50');
      
      fireEvent.blur(secondaryInput);
      
      expect(mockOnColorChange).toHaveBeenCalledWith({
        primary: '#3B82F6',
        secondary: '#4CAF50'
      });
    });

    it('opens color picker modal when color swatch is clicked', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const colorSwatch = screen.getByRole('button', { name: /open primary color picker/i });
      await userEvent.click(colorSwatch);
      
      expect(screen.getByRole('dialog', { name: /color picker/i })).toBeInTheDocument();
    });

    it('closes color picker when escape is pressed', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const colorSwatch = screen.getByRole('button', { name: /open primary color picker/i });
      await userEvent.click(colorSwatch);
      
      const colorPicker = screen.getByRole('dialog', { name: /color picker/i });
      fireEvent.keyDown(colorPicker, { key: 'Escape', code: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /color picker/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Color Validation', () => {
    it('validates hex color format on input', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, 'invalid-color');
      
      fireEvent.blur(primaryInput);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid color format')
      );
    });

    it('accepts valid hex colors', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      const validColors = ['#FF5722', '#4caf50', '#2196F3'];
      
      for (const color of validColors) {
        await userEvent.clear(primaryInput);
        await userEvent.type(primaryInput, color);
        fireEvent.blur(primaryInput);
        
        expect(mockOnColorChange).toHaveBeenCalledWith(
          expect.objectContaining({ primary: color.toUpperCase() })
        );
      }
    });

    it('validates color contrast accessibility', async () => {
      // Mock low contrast ratio
      const { getContrastRatio } = require('../../../client/src/utils/colorUtils');
      getContrastRatio.mockReturnValue(2.1); // Below WCAG AA standard
      
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, '#FFFF00');
      
      fireEvent.blur(primaryInput);
      
      expect(screen.getByText(/low contrast warning/i)).toBeInTheDocument();
      expect(screen.getByText(/wcag aa compliance/i)).toBeInTheDocument();
    });

    it('shows accessibility badge for high contrast colors', async () => {
      // Mock high contrast ratio
      const { getContrastRatio } = require('../../../client/src/utils/colorUtils');
      getContrastRatio.mockReturnValue(7.2); // Above WCAG AAA standard
      
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, '#000000');
      
      fireEvent.blur(primaryInput);
      
      expect(screen.getByText(/wcag aaa compliant/i)).toBeInTheDocument();
    });
  });

  describe('Preset Color Schemes', () => {
    it('applies preset scheme when clicked', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const blueScheme = screen.getByRole('button', { name: /apply blue ocean scheme/i });
      await userEvent.click(blueScheme);
      
      expect(mockOnSchemeChange).toHaveBeenCalledWith({
        id: 'blue',
        name: 'Blue Ocean',
        primary: '#3B82F6',
        secondary: '#1E40AF',
        description: 'Professional blue theme'
      });
    });

    it('highlights selected preset scheme', () => {
      const propsWithSelectedScheme = {
        ...defaultProps,
        selectedSchemeId: 'purple'
      };
      
      render(<ColorSchemePicker {...propsWithSelectedScheme} />);
      
      const purpleScheme = screen.getByRole('button', { name: /apply purple galaxy scheme/i });
      expect(purpleScheme).toHaveClass('ring-2', 'ring-primary');
    });

    it('generates custom scheme when none match current colors', () => {
      const propsWithCustomColors = {
        ...defaultProps,
        primaryColor: '#FF1234',
        secondaryColor: '#AB5678'
      };
      
      render(<ColorSchemePicker {...propsWithCustomColors} />);
      
      expect(screen.getByText(/custom scheme/i)).toBeInTheDocument();
    });
  });

  describe('Advanced Color Controls', () => {
    it('provides HSL sliders in advanced mode', async () => {
      render(<ColorSchemePicker {...defaultProps} advancedMode={true} />);
      
      expect(screen.getByLabelText(/hue/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/saturation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lightness/i)).toBeInTheDocument();
    });

    it('updates color via HSL sliders', async () => {
      render(<ColorSchemePicker {...defaultProps} advancedMode={true} />);
      
      const hueSlider = screen.getByLabelText(/hue/i);
      fireEvent.change(hueSlider, { target: { value: '180' } });
      
      expect(mockOnColorChange).toHaveBeenCalled();
    });

    it('generates color palette variations', async () => {
      render(<ColorSchemePicker {...defaultProps} showPalette={true} />);
      
      expect(screen.getByText(/color palette/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /palette color/i })).toHaveLength(6);
    });

    it('allows selection of palette variations', async () => {
      render(<ColorSchemePicker {...defaultProps} showPalette={true} />);
      
      const paletteColor = screen.getAllByRole('button', { name: /palette color/i })[0];
      await userEvent.click(paletteColor);
      
      expect(mockOnColorChange).toHaveBeenCalled();
    });
  });

  describe('Color Harmony Suggestions', () => {
    it('provides complementary color suggestions', () => {
      render(<ColorSchemePicker {...defaultProps} showHarmony={true} />);
      
      expect(screen.getByText(/complementary/i)).toBeInTheDocument();
      expect(screen.getByText(/triadic/i)).toBeInTheDocument();
      expect(screen.getByText(/analogous/i)).toBeInTheDocument();
    });

    it('applies harmony suggestion when clicked', async () => {
      render(<ColorSchemePicker {...defaultProps} showHarmony={true} />);
      
      const complementaryButton = screen.getByRole('button', { name: /apply complementary/i });
      await userEvent.click(complementaryButton);
      
      expect(mockOnColorChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all color inputs', () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      const secondaryInput = screen.getByLabelText(/secondary color/i);
      
      expect(primaryInput).toHaveAttribute('aria-describedby');
      expect(secondaryInput).toHaveAttribute('aria-describedby');
    });

    it('provides keyboard navigation for preset schemes', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const firstPreset = screen.getByRole('button', { name: /apply blue ocean scheme/i });
      firstPreset.focus();
      
      expect(firstPreset).toHaveFocus();
      
      fireEvent.keyDown(firstPreset, { key: 'ArrowDown' });
      
      const secondPreset = screen.getByRole('button', { name: /apply purple galaxy scheme/i });
      expect(secondPreset).toHaveFocus();
    });

    it('announces color changes to screen readers', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, '#FF5722');
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/primary color updated/i);
    });

    it('provides color descriptions for colorblind users', () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      expect(screen.getByText(/bright blue/i)).toBeInTheDocument();
      expect(screen.getByText(/vibrant purple/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Preview', () => {
    it('shows live color preview as user types', async () => {
      render(<ColorSchemePicker {...defaultProps} showPreview={true} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, '#FF5722');
      
      const previewElement = screen.getByTestId('color-preview');
      expect(previewElement).toHaveStyle('background-color: #FF5722');
    });

    it('updates preview with theme variations', async () => {
      render(<ColorSchemePicker {...defaultProps} showPreview={true} />);
      
      const purpleScheme = screen.getByRole('button', { name: /apply purple galaxy scheme/i });
      await userEvent.click(purpleScheme);
      
      const previewCard = screen.getByTestId('theme-preview');
      expect(previewCard).toHaveClass('bg-secondary');
    });
  });

  describe('Error States', () => {
    it('displays error when invalid color is entered', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, 'not-a-color');
      
      fireEvent.blur(primaryInput);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/invalid color format/i);
    });

    it('resets to previous valid color on invalid input', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i) as HTMLInputElement;
      const originalValue = primaryInput.value;
      
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, 'invalid');
      fireEvent.blur(primaryInput);
      
      await waitFor(() => {
        expect(primaryInput.value).toBe(originalValue);
      });
    });
  });

  describe('Performance', () => {
    it('debounces color change events', async () => {
      render(<ColorSchemePicker {...defaultProps} />);
      
      const primaryInput = screen.getByLabelText(/primary color/i);
      
      // Rapid typing should debounce calls
      await userEvent.clear(primaryInput);
      await userEvent.type(primaryInput, '#FF0000');
      
      // Should only call once after debounce period
      await waitFor(() => {
        expect(mockOnColorChange).toHaveBeenCalledTimes(1);
      });
    });

    it('memoizes preset scheme rendering', () => {
      const { rerender } = render(<ColorSchemePicker {...defaultProps} />);
      
      const initialPresets = screen.getAllByRole('button', { name: /apply.*scheme/i });
      
      // Re-render with same props
      rerender(<ColorSchemePicker {...defaultProps} />);
      
      const updatedPresets = screen.getAllByRole('button', { name: /apply.*scheme/i });
      expect(updatedPresets).toHaveLength(initialPresets.length);
    });
  });
});
