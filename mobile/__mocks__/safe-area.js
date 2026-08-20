const React = require('react');

export const SafeAreaProvider = ({ children }) => children;
export const SafeAreaView = ({ children, ...props }) => {
  return React.createElement('SafeAreaView', props, children);
};
export const useSafeAreaInsets = () => ({ top: 44, bottom: 34, left: 0, right: 0 });
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 390, height: 844 });