import { HttpStatus } from '@nestjs/common';

export class ResponseDto<T> {
  status: boolean;
  message: string;
  httpStatusCode: number;
  data: T;

  private constructor(status: boolean, message: string, httpStatusCode: number, data: T) {
    this.status = status;
    this.message = message;
    this.httpStatusCode = httpStatusCode;
    this.data = data;
  }

  static success<T>(message: string, httpStatusCode: number, data: T): ResponseDto<T> {
    return new ResponseDto<T>(true, message, httpStatusCode, data);
  }

  static failure<T>(message: string, httpStatusCode: number, data: T): ResponseDto<T> {
    return new ResponseDto<T>(false, message, httpStatusCode, data);
  }
}
