# GatherGrove Mobile App

React Native mobile application for GatherGrove club management platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS (macOS only):
```bash
cd ios && pod install
```

3. Create environment configuration:
Create a `.env` file in the mobile directory with:
```
API_BASE_URL=http://localhost:5284
NODE_ENV=development
```

### Development

- **Start Metro bundler:**
```bash
npm start
# or with Expo
yarn expo start
```

- **Run on Android:**
```bash
npm run android
```

- **Run on iOS:**
```bash
npm run ios
```

- **Check version compatibility:**
```bash
yarn check-versions
```

### Testing

- **Run tests:**
```bash
npm test
```

- **Run tests with coverage:**
```bash
npm run test:coverage
```

- **Type checking:**
```bash
npm run typecheck
```

## 🔧 Troubleshooting

### React Native Version Compatibility Issues

If you encounter parsing errors or bundling issues:

1. **Check version compatibility:**
   ```bash
   yarn check-versions
   ```

2. **Update React Native toolchain packages if mismatched:**
   ```bash
   # The version checker will show the exact command needed
   yarn add -D @react-native/babel-preset@^0.79.3 @react-native/eslint-config@^0.79.3 @react-native/metro-config@^0.79.3 @react-native/typescript-config@^0.79.3
   ```

3. **Clear cache and restart:**
   ```bash
   yarn expo start --clear
   ```

### Common Issues
- **TypeScript parsing errors**: Ensure all `@react-native/*` packages match your React Native version
- **Metro bundler issues**: Clear cache with `--clear` flag  
- **Version mismatches**: Use `yarn check-versions` to detect and fix

### Current Version Compatibility
- **React Native**: 0.79.3
- **React**: 19.0.0
- **Expo**: ~53.0.0
- **TypeScript**: ^5.3.3
- **All @react-native/* packages**: 0.79.x

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # App screens
├── navigation/     # Navigation configuration
├── services/       # API services
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
├── utils/          # Helper functions
└── constants/      # App constants
```

## 🔐 Authentication

The mobile app integrates with the GatherGrove backend API for authentication:

- JWT token-based authentication
- Secure token storage using React Native Keychain
- Support for Member role with Grow tier clubs only

## 🧪 Testing

- Unit tests with Jest and React Native Testing Library
- Coverage reporting
- Mock implementations for native modules

## 📱 Platform Support

- iOS 12.0+
- Android API level 21+

## 🔧 Development Tools

- TypeScript for type safety
- ESLint for code linting
- Jest for testing
- Metro for bundling 

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
Create a `.env` file in the mobile directory with:
```
API_BASE_URL=http://localhost:5284
NODE_ENV=development
```

3. Start the development server:
```bash
npm start
```

## Development Notes

### Authentication
- The app uses React Native Keychain for secure token storage
- Falls back to AsyncStorage when running in Expo Go (keychain not available)
- Tokens are automatically included in API requests via axios interceptors

### Push Notifications (Optional)
For push notifications in production, configure these environment variables:
```
AZURE_NOTIFICATION_HUB_CONNECTION_STRING=your-connection-string
AZURE_NOTIFICATION_HUB_NAME=your-hub-name
EXPO_PROJECT_ID=your-expo-project-id
```

Note: Push notifications don't work in Expo Go - you need an EAS build or development build.

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

## Troubleshooting

### Keychain Errors
If you see "Cannot read property 'getInternetCredentialsForServer' of null", this is normal in Expo Go. The app automatically falls back to AsyncStorage.

### Azure Configuration Warnings
Azure Notification Hub warnings are normal in development. The app will work without push notifications. 