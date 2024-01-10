import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateStudentDto {
  @ApiProperty({ description: "로그인 아이디(학번)", required: false, example: "20200313131" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ description: "비밀 번호", required: false, example: "1111" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: "이름", required: false, example: "홍길동" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: "이메일", required: false, example: "abc@gmail.com" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "연락처", required: false, example: "01010101010" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: "학과 아이디", required: false, example: "1" })
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  deptId: number;
}
