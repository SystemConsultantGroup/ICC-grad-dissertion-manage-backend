export class CommonResponseDto<T = void> {
  message: string;

  constructor(object?: T, message = 'success') {
    this.message = message;
    object && Object.assign(this, object);
  }
}
