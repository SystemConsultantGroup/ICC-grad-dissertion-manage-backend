import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum ThesisQueryType {
  PRELIMINARY = "pre",
  MAIN = "main",
  REVISION = "rivision",
  NOW = "now",
}

export class ThesisInfoQueryDto {
  @ApiProperty({ description: "논문 정보 타입 선택", example: "now", enum: ["now", "pre", "main", "rivision"] })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ThesisQueryType)
  type: string;
}
