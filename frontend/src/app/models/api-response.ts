export interface APIResponse<T> {
  success: boolean;
  data: T | string | string[];
}

export function responseAdapter<T>(response: APIResponse<T>): T | null {
  if (response.success) {
    return response.data as T;
  } else {
    return null;
  }
}

