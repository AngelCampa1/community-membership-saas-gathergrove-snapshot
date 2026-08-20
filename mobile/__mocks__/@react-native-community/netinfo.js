// Manual mock for @react-native-community/netinfo
const netInfoState = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
  details: {
    isConnectionExpensive: false,
    ssid: 'test-wifi',
    strength: 100,
    ipAddress: '192.168.1.1',
  },
};

const NetInfo = {
  fetch: jest.fn(() => Promise.resolve(netInfoState)),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => netInfoState),
  configure: jest.fn(),
};

export default NetInfo;
