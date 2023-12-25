import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateStudentDto {
  // 사용자 정보
  @ApiProperty({ description: "로그인 아이디(학번)" })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ description: "비밀번호" })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: "학생 이름" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: "학생 이메일" })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "학생 전화번호" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: "학과 아이디" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  deptId: number;

  // 논문 과정 정보
  @ApiProperty({ description: "시스템 락 여부" })
  @IsNotEmpty()
  @Type(() => Boolean)
  @IsBoolean()
  isLock: boolean;

  @ApiProperty({ description: "심사위원장 아이디" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  headReviewerId: number;

  @ApiProperty({ description: "시스템 단계 아이디" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  phaseId: number;

  // 심사 위원 정보
  @ApiProperty({ description: "심사위원 아이디 리스트(심사위원장 반드시 포함)", type: [Number] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  reviewerIds: number[];

  // 논문 정보
  @ApiPropertyOptional({ description: "예심 논문 제목" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  preThesisTitle: string;

  @ApiPropertyOptional({ description: "본심 논문 제목" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  mainThesisTitle: string;
}
