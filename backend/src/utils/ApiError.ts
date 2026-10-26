class ApiError extends Error {
  statusCode: number;
  success: boolean;
  errors: string[];
  code?: string;

  constructor(statusCode: number, message: string, errors: string[] = [], code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;