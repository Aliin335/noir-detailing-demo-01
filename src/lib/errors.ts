export type AppErrorCode =
  | "INVALID_INPUT"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "PAST_DATE"
  | "PAST_TIME"
  | "SERVICE_NOT_FOUND"
  | "BUSINESS_CLOSED"
  | "SLOT_UNAVAILABLE"
  | "SERVICE_ID_CONFLICT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "AI_SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly headers?: Record<string, string>;

  constructor(code: AppErrorCode, message: string, status: number, headers?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.headers = headers;
  }
}

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  INVALID_INPUT: 400,
  INVALID_DATE: 400,
  INVALID_TIME: 400,
  PAST_DATE: 400,
  PAST_TIME: 400,
  SERVICE_NOT_FOUND: 404,
  BUSINESS_CLOSED: 400,
  SLOT_UNAVAILABLE: 409,
  SERVICE_ID_CONFLICT: 409,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  AI_SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export function appError(
  code: AppErrorCode,
  message: string,
  headers?: Record<string, string>
): AppError {
  return new AppError(code, message, STATUS_BY_CODE[code], headers);
}
