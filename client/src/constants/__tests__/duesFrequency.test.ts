import { 
  DUES_FREQUENCY_OPTIONS, 
  getDuesFrequencyOption, 
  getDuesFrequencyLabel,
  DuesFrequency 
} from '../duesFrequency';

describe('Dues Frequency Constants', () => {
  describe('DUES_FREQUENCY_OPTIONS', () => {
    it('should have all expected frequency options', () => {
      const expectedFrequencies = [
        'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 
        'Semiannually', 'Annually', 'Biennially', 'OneTime'
      ];
      
      expect(DUES_FREQUENCY_OPTIONS).toHaveLength(8);
      
      expectedFrequencies.forEach(frequency => {
        const option = DUES_FREQUENCY_OPTIONS.find(opt => opt.value === frequency);
        expect(option).toBeDefined();
        expect(option?.label).toBeTruthy();
        expect(option?.description).toBeTruthy();
      });
    });

    it('should have consistent structure for all options', () => {
      DUES_FREQUENCY_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('description');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
        expect(typeof option.description).toBe('string');
      });
    });
  });

  describe('getDuesFrequencyOption', () => {
    it('should return correct option for valid value', () => {
      const monthlyOption = getDuesFrequencyOption('Monthly');
      expect(monthlyOption).toEqual({
        value: 'Monthly',
        label: 'Monthly',
        description: 'Every month'
      });
    });

    it('should return undefined for invalid value', () => {
      const invalidOption = getDuesFrequencyOption('InvalidFrequency');
      expect(invalidOption).toBeUndefined();
    });
  });

  describe('getDuesFrequencyLabel', () => {
    it('should return correct label for valid value', () => {
      expect(getDuesFrequencyLabel('Weekly')).toBe('Weekly');
      expect(getDuesFrequencyLabel('Biweekly')).toBe('Biweekly');
      expect(getDuesFrequencyLabel('Semiannually')).toBe('Semiannually');
      expect(getDuesFrequencyLabel('OneTime')).toBe('One-time');
    });

    it('should return original value for invalid frequency', () => {
      expect(getDuesFrequencyLabel('InvalidFrequency')).toBe('InvalidFrequency');
    });
  });

  describe('DuesFrequency type', () => {
    it('should accept all valid frequency values', () => {
      const validFrequencies: DuesFrequency[] = [
        'Weekly', 'Biweekly', 'Monthly', 'Quarterly',
        'Semiannually', 'Annually', 'Biennially', 'OneTime'
      ];
      
      expect(validFrequencies).toHaveLength(8);
      validFrequencies.forEach(frequency => {
        expect(DUES_FREQUENCY_OPTIONS.find(opt => opt.value === frequency)).toBeDefined();
      });
    });
  });
}); 