import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';

jest.unmock('@/contexts/ThemeContext');
jest.unmock('../ThemeContext');

function ThemeProbe() {
  const { colors, chatColors, responsive } = useTheme();

  return (
    <>
      <Text testID="primary-background">{colors.background.primary}</Text>
      <Text testID="chat-background">{chatColors.inputBackground}</Text>
      <Text testID="responsive-state">{responsive.isSmallScreen ? 'small' : 'regular'}</Text>
    </>
  );
}

describe('ThemeContext', () => {
  it('renders children with light theme values', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(getByTestId('primary-background')).toBeTruthy();
    expect(getByTestId('chat-background')).toBeTruthy();
    expect(getByTestId('responsive-state')).toBeTruthy();
  });

  it('throws when useTheme is used outside ThemeProvider', () => {
    const BrokenProbe = () => {
      useTheme();
      return <Text>Broken</Text>;
    };

    expect(() => render(<BrokenProbe />)).toThrow('useTheme must be used within a ThemeProvider');
  });
});
