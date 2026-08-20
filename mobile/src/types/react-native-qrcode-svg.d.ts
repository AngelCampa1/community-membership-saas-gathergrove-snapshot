declare module 'react-native-qrcode-svg' {
  import { Component } from 'react';
  import { ViewStyle, ImageSourcePropType } from 'react-native';

  interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: ImageSourcePropType;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    gradientDirection?: string[];
    linearGradient?: string[];
    style?: ViewStyle;
  }

  export default class QRCode extends Component<QRCodeProps> {}
}