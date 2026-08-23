export type AppErrorCode =
  | "INVALID_INPUT"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "PAST_DATE"
  | "PAST_TIME"
  | "SERVICE_NOT_FOUND"
  | "BUSINESS_CLOSED"
  | "SLOT_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
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
  INTERNAL_ERROR: 500,
};

export function appError(code: AppErrorCode, message: string): AppError {
  return new AppError(code, message, STATUS_BY_CODE[code]);
}
