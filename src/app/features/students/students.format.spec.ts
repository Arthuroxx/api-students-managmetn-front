import {
  formatBirthDate,
  formatTimestamp,
  studentFullName,
  studentInitials,
  toDateInputValue,
  todayIsoDate,
} from './students.format';

describe('student format helpers', () => {
  it('should build the full name and initials', () => {
    expect(studentFullName({ firstName: 'Ana', lastName: 'Lopez' })).toBe('Ana Lopez');
    expect(studentInitials({ firstName: 'ana', lastName: 'lopez' })).toBe('AL');
  });

  it('should fall back to a placeholder when initials are missing', () => {
    expect(studentInitials({ firstName: '', lastName: '  ' })).toBe('?');
  });

  it('should format a date-only birth date in UTC', () => {
    expect(formatBirthDate('2000-05-10T00:00:00.000Z')).toBe('May 10, 2000');
  });

  it('should format timestamps in the visitor locale', () => {
    expect(formatTimestamp('2026-11-01T10:00:00.000Z')).toBe('Nov 1, 2026');
  });

  it('should render a dash for an invalid date', () => {
    expect(formatBirthDate('not-a-date')).toBe('—');
    expect(formatTimestamp('not-a-date')).toBe('—');
  });

  it('should reduce an API date to an input value', () => {
    expect(toDateInputValue('2000-05-10T00:00:00.000Z')).toBe('2000-05-10');
    expect(toDateInputValue('2000-05-10')).toBe('2000-05-10');
    expect(toDateInputValue('')).toBe('');
  });

  it('should expose today as an ISO date', () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
