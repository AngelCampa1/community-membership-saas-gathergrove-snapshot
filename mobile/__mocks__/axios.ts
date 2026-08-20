// Manual mock for axios - CommonJS format for Jest
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn((error) => error?.isAxiosError === true),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: mockAxiosInstance.interceptors,
};

module.exports = mockAxios;
module.exports.default = mockAxios;
module.exports.mockAxiosInstance = mockAxiosInstance;
