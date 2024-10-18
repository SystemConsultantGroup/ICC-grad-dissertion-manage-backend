import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";
import { IsKoreanPhoneNumber } from "src/common/decorators/is-kr-phone-number.decorator";

export class CreatePhDDto {
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
  @IsKoreanPhoneNumber()
  phone: string;

  @ApiProperty({ description: "학과 아이디", example: "1" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  deptId: number;
}
