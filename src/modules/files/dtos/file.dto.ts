import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { UUID } from "crypto";

export class FileDto {
  // TODO: 요청 형식은 추후 수정

  @ApiProperty({ description: "파일 uuid", example: "11111111-1111-1111-1111-1111111111" })
  @IsUUID()
  uuid: string;

  @ApiProperty({ description: "파일 이름" })
  name: string;

  @ApiProperty({ description: "파일 타입" })
  mimeType: string;
}
