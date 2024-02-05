import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum ThesisQueryType {
  PRELIMINARY = "pre",
  MAIN = "main",
  REVISION = "revision",
  NOW = "now",
}

export class ThesisInfoQueryDto {
  @ApiProperty({ description: "논문 정보 타입 선택", example: "now", enum: ThesisQueryType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ThesisQueryType)
  type: ThesisQueryType;
}
