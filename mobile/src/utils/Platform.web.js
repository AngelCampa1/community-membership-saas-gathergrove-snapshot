/**
 * Web-compatible Platform implementation for React Native Web
 * This provides the Platform API that works on web browsers
 */

const Platform = {
  OS: 'web',
  Version: 1,
  isTV: false,
  isTesting: false,
  isPad: false,
  isVision: false,
  constants: {
    isTesting: false,
    isDisableAnimations: false,
    reactNativeVersion: {
      major: 0,
      minor: 72,
      patch: 0,
      prerelease: null,
    },
  },
  select: (obj) => {
    return obj.web || obj.default;
  },
};

export default Platform;
module.exports = Platform;