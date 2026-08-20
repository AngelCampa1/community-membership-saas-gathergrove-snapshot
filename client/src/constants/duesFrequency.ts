export interface DuesFrequencyOption {
  value: string;
  label: string;
  description?: string;
}

export const DUES_FREQUENCY_OPTIONS: DuesFrequencyOption[] = [
  { value: 'Weekly', label: 'Weekly', description: 'Every week' },
  { value: 'Biweekly', label: 'Biweekly', description: 'Every 2 weeks' },
  { value: 'Monthly', label: 'Monthly', description: 'Every month' },
  { value: 'Quarterly', label: 'Quarterly', description: 'Every 3 months' },
  { value: 'Semiannually', label: 'Semiannually', description: 'Every 6 months' },
  { value: 'Annually', label: 'Annually', description: 'Every year' },
  { value: 'Biennially', label: 'Biennially', description: 'Every 2 years' },
  { value: 'OneTime', label: 'One-time', description: 'Single payment' },
];

// Helper function to get frequency option by value
export const getDuesFrequencyOption = (value: string): DuesFrequencyOption | undefined => {
  return DUES_FREQUENCY_OPTIONS.find(option => option.value === value);
};

// Helper function to get frequency label by value
export const getDuesFrequencyLabel = (value: string): string => {
  const option = getDuesFrequencyOption(value);
  return option?.label || value;
};

// Type for TypeScript validation
export type DuesFrequency = typeof DUES_FREQUENCY_OPTIONS[number]['value']; 