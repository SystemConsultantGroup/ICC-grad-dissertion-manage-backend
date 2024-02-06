import { ApiProperty } from "@nestjs/swagger";
import { Stage } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateStudentDto {
  // 사용자 정보
  @ApiProperty({ description: "로그인 아이디(학번)", example: "2022000000" })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ description: "비밀번호(생년월일)", example: "010101" })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: "학생 이름", example: "홍길동" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: "학생 이메일", example: "abc@gmail.com", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "학생 전화번호", example: "010-1111-1222", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: "학과 아이디", example: "1" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  deptId: number;

  // 시스템 단계
  @ApiProperty({
    description: "시스템 단계(예심, 본심)",
    example: `${Stage.PRELIMINARY} || ${Stage.MAIN}`,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Stage)
  stage: Stage;

  // 심사 위원 정보
  @ApiProperty({ description: "심사위원장 아이디", example: "2" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  headReviewerId: number;

  @ApiProperty({ description: "지도교수 아이디 리스트", type: [Number], example: "[3, 4]" })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  advisorIds: number[];

  @ApiProperty({ description: "심사위원 아이디 리스트", type: [Number], example: "[10, 11]" })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  committeeIds: number[];

  // 논문 정보
  @ApiProperty({ description: "논문 제목", example: "논문 제목 예시" })
  @IsNotEmpty()
  @IsString()
  thesisTitle: string;
}
