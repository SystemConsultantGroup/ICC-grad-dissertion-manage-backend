import { ApiProperty } from "@nestjs/swagger";

export class CommonResponseDto<T = void> {
  @ApiProperty({ description: "응답 메시지" })
  message: string;

  constructor(object?: T, message = "success") {
    this.message = message;
    object && Object.assign(this, object);
  }
}
