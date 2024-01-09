import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateThesisInfoDto {
  @ApiProperty({ description: "논문 제목", required: false, example: "아주 멋진 논문 제목" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: "논문 초록", required: false, example: "이 논문은 아주 멋진 논문입니다." })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  abstract: string;

  @ApiProperty({ description: "논문 파일 uuid", required: false, example: "11111111-1111-1111-1111-1111111111" })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  thesisFileUUID: string;

  @ApiProperty({ description: "논문 발표 uuid", required: false, example: "11111111-1111-1111-2222-2222222222" })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  presentationFileUUID: string;
}
