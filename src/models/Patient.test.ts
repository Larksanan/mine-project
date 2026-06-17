import Patient from './Patient';

describe('Patient Model Logic', () => {
  // Mock system time to ensure age calculations are stable
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-20'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('calculateAge', () => {
    it('should calculate the correct age when the birthday has already passed this year', () => {
      const patient = new Patient({
        dateOfBirth: new Date('1990-01-01'),
      });
      expect(patient.calculateAge()).toBe(34);
    });

    it('should calculate the correct age when the birthday has not yet occurred this year', () => {
      const patient = new Patient({
        dateOfBirth: new Date('1990-12-31'),
      });
      expect(patient.calculateAge()).toBe(33);
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI correctly for standard height and weight', () => {
      const patient = new Patient({
        height: 180, // 1.8m
        weight: 75, // kg
      });
      // 75 / (1.8 * 1.8) = 23.148...
      expect(patient.calculateBMI()).toBe(23.15);
    });

    it('should return null if height is missing or zero to prevent division by zero', () => {
      const patient = new Patient({ weight: 70 });
      expect(patient.calculateBMI()).toBeNull();
    });
  });

  describe('getBMICategory', () => {
    it('should return "Normal weight" for a BMI of 22', () => {
      const patient = new Patient({ height: 100, weight: 22 });
      expect(patient.getBMICategory()).toBe('Normal weight');
    });
  });
});
