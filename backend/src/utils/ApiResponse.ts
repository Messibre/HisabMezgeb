
interface IApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
}

export class SuccessResponse<T = any> implements IApiResponse {
  statusCode: number;
  success: boolean = true; // Always true
  message: string;
  data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export class ErrorResponse<E = any> implements IApiResponse {
  statusCode: number;
  success: boolean = false; // Always false
  message: string;
  errors: E; // Clean semantic naming for client parsing!
  code?: string;
  requestId?: string;

  constructor(
    statusCode: number,
    message: string,
    errors: E,
    code?: string,
    requestId?: string
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    if (code !== undefined) {
      this.code = code;
    }
    if (requestId !== undefined) {
      this.requestId = requestId;
    }
  }
}