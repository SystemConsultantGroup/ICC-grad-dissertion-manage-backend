import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";

export class UpdateSystemDto {
  @ApiProperty({ description: "수정할 현재 시스템 단계", required: false, example: "1" })
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  phaseId: number;

  @ApiProperty({ description: "수정할 시스템 락 여부", required: false, example: "false" })
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  isLock: boolean;
}
