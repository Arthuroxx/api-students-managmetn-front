export const STUDENT_PAGE_SIZES = [10, 25, 50] as const;

export type StudentPageSize = (typeof STUDENT_PAGE_SIZES)[number];

export interface Student {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly documentNumber: string;
  readonly birthDate: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StudentInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly documentNumber: string;
  readonly birthDate: string;
}

export type UpdateStudentInput = Partial<StudentInput>;

export interface StudentFilters {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
}

export interface StudentQuery extends StudentFilters {
  readonly page: number;
  readonly limit: number;
}

export interface StudentsPageMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface PaginatedStudents {
  readonly data: readonly Student[];
  readonly meta: StudentsPageMeta;
}

export function isStudentPageSize(value: number): value is StudentPageSize {
  return (STUDENT_PAGE_SIZES as readonly number[]).includes(value);
}
