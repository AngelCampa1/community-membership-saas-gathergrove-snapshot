/**
 * Platform-compatible CardField wrapper
 * Uses native CardField on mobile and web-compatible fallback on web
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { isStripeNativeAvailable } from '@/utils/platformUtils';
import { LIGHT_THEME } from '../constants/colors';

// Safe StyleSheet wrapper for testing
const safeStyleSheet = {
  create: (styles: Record<string, ViewStyle | object>) => {
    try {
      return StyleSheet?.create ? StyleSheet.create(styles) : styles;
    } catch (error) {
      // SECURITY FIX: Log StyleSheet initialization failure
      console.error('[CardFieldWrapper] Failed to create StyleSheet:', error);
      return styles;
    }
  }
};

interface CardDetails {
  complete: boolean;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
  postalCode?: string;
}

interface CardStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  placeholderColor?: string;
}

interface CardFieldWrapperProps {
  onCardChange?: (cardDetails: CardDetails) => void;
  style?: ViewStyle;
  cardStyle?: CardStyle;
  testID?: string;
  postalCodeEnabled?: boolean;
  placeholders?: {
    number?: string;
  };
}

// Web-compatible card input component
const WebCardField: React.FC<CardFieldWrapperProps> = ({
  onCardChange,
  style,
  testID,
  placeholders,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const handleCardNumberChange = useCallback((text: string) => {
    // Format card number with spaces
    const formatted = text.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    
    // Check if card is complete (basic validation)
    const complete = text.replace(/\s/g, '').length >= 16 && 
                    expiryDate.length >= 5 && 
                    cvc.length >= 3;
    
    onCardChange?.({
      complete,
      cardNumber: formatted,
      expiryDate,
      cvc,
      postalCode,
    } as CardDetails);
  }, [expiryDate, cvc, postalCode, onCardChange]);

  const handleExpiryChange = useCallback((text: string) => {
    // Format MM/YY
    const formatted = text.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substr(0, 5);
    setExpiryDate(formatted);
    
    const complete = cardNumber.replace(/\s/g, '').length >= 16 && 
                    formatted.length >= 5 && 
                    cvc.length >= 3;
    
    onCardChange?.({
      complete,
      cardNumber,
      expiryDate: formatted,
      cvc,
      postalCode,
    } as CardDetails);
  }, [cardNumber, cvc, postalCode, onCardChange]);

  const handleCvcChange = useCallback((text: string) => {
    const formatted = text.replace(/\D/g, '').substr(0, 4);
    setCvc(formatted);
    
    const complete = cardNumber.replace(/\s/g, '').length >= 16 && 
                    expiryDate.length >= 5 && 
                    formatted.length >= 3;
    
    onCardChange?.({
      complete,
      cardNumber,
      expiryDate,
      cvc: formatted,
      postalCode,
    } as CardDetails);
  }, [cardNumber, expiryDate, postalCode, onCardChange]);

  const handlePostalCodeChange = useCallback((text: string) => {
    setPostalCode(text);
    
    const complete = cardNumber.replace(/\s/g, '').length >= 16 && 
                    expiryDate.length >= 5 && 
                    cvc.length >= 3;
    
    onCardChange?.({
      complete,
      cardNumber,
      expiryDate,
      cvc,
      postalCode: text,
    } as CardDetails);
  }, [cardNumber, expiryDate, cvc, onCardChange]);

  return (
    <View style={[styles.webCardContainer, style]} testID={testID}>
      <Text style={styles.webCardLabel} testID="card-information-label">Card Information</Text>

      <TextInput
        style={styles.webCardInput}
        placeholder={placeholders?.number || "1234 5678 9012 3456"}
        value={cardNumber}
        onChangeText={handleCardNumberChange}
        keyboardType="numeric"
        maxLength={19} // 16 digits + 3 spaces
        testID="card-number-input"
      />

      <View style={styles.webCardRow}>
        <TextInput
          style={[styles.webCardInput, styles.webCardInputHalf]}
          placeholder="MM/YY"
          value={expiryDate}
          onChangeText={handleExpiryChange}
          keyboardType="numeric"
          maxLength={5}
          testID="card-expiry-input"
        />
        <TextInput
          style={[styles.webCardInput, styles.webCardInputHalf]}
          placeholder="CVC"
          value={cvc}
          onChangeText={handleCvcChange}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          testID="card-cvc-input"
        />
      </View>

      <TextInput
        style={styles.webCardInput}
        placeholder="Postal Code"
        value={postalCode}
        onChangeText={handlePostalCodeChange}
        autoCapitalize="characters"
        testID="card-postal-input"
      />

      <Text style={styles.webCardHint} testID="card-demo-hint">
        💳 This is a demo payment form for web compatibility
      </Text>
    </View>
  );
};

// Native CardField (lazy-loaded)
let NativeCardField: React.ComponentType<CardFieldWrapperProps> | null = null;

if (isStripeNativeAvailable()) {
  try {
    const { CardField } = require('@stripe/stripe-react-native');
    NativeCardField = CardField;
  } catch (error) {
    // SECURITY FIX: Log Stripe CardField import failure for debugging
    console.error('[CardFieldWrapper] Failed to load Stripe CardField:', error);
    console.warn('[CardFieldWrapper] Payment form will use fallback UI. Please ensure @stripe/stripe-react-native is installed.');
    NativeCardField = null;
  }
}

export const CardFieldWrapper: React.FC<CardFieldWrapperProps> = (props) => {
  // Use native CardField if available
  if (NativeCardField && isStripeNativeAvailable()) {
    return <NativeCardField {...props} />;
  }

  // Fall back to web-compatible component
  return <WebCardField {...props} />;
};

const styles = safeStyleSheet.create({
  webCardContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_THEME.border.primary,
    borderRadius: 8,
    backgroundColor: LIGHT_THEME.background.primary,
  },
  webCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: LIGHT_THEME.text.primary,
  },
  webCardInput: {
    borderWidth: 1,
    borderColor: LIGHT_THEME.border.secondary,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: LIGHT_THEME.background.secondary,
  },
  webCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  webCardInputHalf: {
    flex: 1,
  },
  webCardHint: {
    fontSize: 12,
    color: LIGHT_THEME.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
  },
});