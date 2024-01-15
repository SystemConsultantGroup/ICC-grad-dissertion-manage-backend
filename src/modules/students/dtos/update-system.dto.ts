import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";

export class UpdateSystemDto {
  @ApiProperty({ description: "수정할 현재 시스템 단계", required: false, example: "1" })
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  phaseId: number;
}
