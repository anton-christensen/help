export interface PaginatedResult<T> {
  data: T[];
  numPages: number;
}

export function createEmptyPaginatedResult<T>(): PaginatedResult<T> {
  return {
    data: [],
    numPages: 0
  };
}
