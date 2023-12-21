import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateStudentDto {
  // 사용자 정보
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  deptId: number;

  // 논문 과정 정보
  @IsNotEmpty()
  @Type(() => Boolean)
  @IsBoolean()
  isLock: boolean;

  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  headReviewerId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  phaseId: number;

  // 심사 위원 정보
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  reviewerIds: number[];

  // 논문 정보
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  preThesisTitle: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  mainThesisTitle: string;
}
