/**
 * GatherGrove Mobile Theme Context
 *
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { LIGHT_THEME, CHAT_COLORS } from '../constants/colors';

export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay?: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
    tertiary: string;
    link?: string;
  };
  interactive: {
    primary: string;
    primaryHover?: string;
    primaryPressed?: string;
    secondary: string;
    secondaryHover?: string;
    secondaryPressed?: string;
    accent?: string;
    accentHover?: string;
    disabled: string;
    disabledText?: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
    successBackground: string;
    warningBackground: string;
    errorBackground: string;
    infoBackground: string;
    infoBorder: string;
    errorBorder: string;
    warningText?: string;
    successBorder?: string;
    warningBorder?: string;
  };
  border: {
    primary: string;
    secondary: string;
    tertiary?: string;
    focus?: string;
  };
  shadow: {
    small: Record<string, unknown>;
    medium: Record<string, unknown>;
    large: Record<string, unknown>;
    md: Record<string, unknown>;
  };
  primary?: string;
}

interface ResponsiveConfig {
  isSmallScreen: boolean;
}

export interface ChatColors {
  ownMessage: string;
  otherMessage: string;
  senderName: string;
  ownMessageText: string;
  otherMessageText: string;
  ownTimestamp: string;
  otherTimestamp: string;
  placeholder: string;
  inputBorder: string;
  inputBackground: string;
  inputText: string;
  sendButton: string;
  sendButtonDisabled: string;
  primary?: string;
  secondary?: string;
}

interface ThemeContextValue {
  colors: ThemeColors;
  responsive: ResponsiveConfig;
  chatColors: ChatColors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colors: ThemeColors = LIGHT_THEME;
  const chatColors: ChatColors = CHAT_COLORS.light;

  // Responsive configuration with actual screen size detection
  const { width } = useWindowDimensions();
  const SMALL_SCREEN_BREAKPOINT = 375; // iPhone SE and smaller devices
  const responsive: ResponsiveConfig = {
    isSmallScreen: width < SMALL_SCREEN_BREAKPOINT,
  };

  const value: ThemeContextValue = {
    colors,
    responsive,
    chatColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for creating themed styles
export const useThemedStyles = <T,>(styleCreator: (colors: ThemeColors) => T): T => {
  const { colors } = useTheme();
  return styleCreator(colors);
};

export default ThemeContext;
