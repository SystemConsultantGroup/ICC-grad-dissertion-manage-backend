import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class StudentSearchQuery {
  @ApiProperty({ description: "학번", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  studentNumber: string;

  @ApiProperty({ description: "이름", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: "이메일", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ description: '전화번호 ("-" 제외)', required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: "학과 아이디", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  departmentId: number;

  @ApiProperty({ description: "시스템 단계 아이디", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  phaseId: number;

  @ApiProperty({ description: "시스템 락 여부", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Boolean)
  isLock: boolean;
}
