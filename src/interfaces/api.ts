export interface IApiResponse<T = unknown> {
  status: 'success' | 'failed';
  data?: T;
  message?: string;
  code?: number;
  requestId?: string;
}

export interface IPaginatedResponse<T> {
  totalCount: number;
  pages: number;
  data: T[];
}

export interface IApiError {
  status: 'failed';
  code: number;
  message: string;
  hints?: string[];
  requestId?: string;
}
