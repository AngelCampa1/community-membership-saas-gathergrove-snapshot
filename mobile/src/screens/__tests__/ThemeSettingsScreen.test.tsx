import { render, fireEvent } from '@testing-library/react-native';
import { ThemeSettingsScreen } from '../ThemeSettingsScreen';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useThemedStyles: (creator: any) =>
    creator({
      background: { primary: '#ffffff', secondary: '#f8fafc' },
      text: { primary: '#111827', secondary: '#4b5563' },
      interactive: { primary: '#10b981' },
      border: { primary: '#e5e7eb' },
    }),
}));

describe('ThemeSettingsScreen', () => {
  const navigation = { goBack: jest.fn() } as any;
  const route = { key: 'ThemeSettings', name: 'ThemeSettings' } as any;

  beforeEach(() => {
    navigation.goBack.mockClear();
  });

  it('shows the fixed light appearance state', () => {
    const { getByText } = render(
      <ThemeSettingsScreen navigation={navigation} route={route} />
    );

    expect(getByText('Appearance')).toBeTruthy();
    expect(getByText('GatherGrove uses the light theme.')).toBeTruthy();
    expect(getByText('Light theme')).toBeTruthy();
  });

  it('navigates back from the header button', () => {
    const { getByTestId } = render(
      <ThemeSettingsScreen navigation={navigation} route={route} />
    );

    fireEvent.press(getByTestId('theme-settings-back-button'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
