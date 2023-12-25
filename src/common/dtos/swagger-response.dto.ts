import { ApiProperty } from "@nestjs/swagger";

export class BaseResponseDto {
  @ApiProperty()
  message: string;
}
