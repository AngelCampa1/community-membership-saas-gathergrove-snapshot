export const useNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
});

export const useRoute = () => ({
  params: { eventId: 1 },
});