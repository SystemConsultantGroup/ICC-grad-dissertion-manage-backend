import { ApiProperty } from "@nestjs/swagger";

export class UpdateThesisInfoDto {
  @ApiProperty({ description: "논문 제목", example: "아주 멋진 논문 제목" })
  title: string;

  @ApiProperty({ description: "논문 초록", example: "이 논문은 아주 멋진 논문입니다." })
  abstract: string;

  @ApiProperty({ description: "논문 파일 uuid", example: "11111111-1111-1111-1111-1111111111" })
  thesisFileUUID: string;

  @ApiProperty({ description: "논문 발표 uuid", example: "11111111-1111-1111-2222-2222222222" })
  presentationFileUUID: string;
}
