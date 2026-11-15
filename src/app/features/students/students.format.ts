import type { Student } from './students.models';

const birthDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const timestampFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function studentFullName(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

export function studentInitials(student: Pick<Student, 'firstName' | 'lastName'>): string {
  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.trim();

  return (initials || '?').toUpperCase();
}

export function formatBirthDate(value: string): string {
  return formatDate(value, birthDateFormatter);
}

export function formatTimestamp(value: string): string {
  return formatDate(value, timestampFormatter);
}

export function toDateInputValue(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] ?? '';
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string, formatter: Intl.DateTimeFormat): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
}
