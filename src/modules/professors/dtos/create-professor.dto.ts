import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsKoreanPhoneNumber } from "src/common/decorators/is-kr-phone-number.decorator";

export class CreateProfessorDto {
  @ApiProperty({
    description: "로그인 아이디",
    example: "prof1",
  })
  @IsNotEmpty({ message: "로그인 아이디를 입력해주세요." })
  @IsString()
  @Type(() => String)
  loginId: string;

  @ApiProperty({
    description: "비밀번호",
    example: "1234",
  })
  @IsNotEmpty({ message: "비밀번호를 입력해주세요." })
  @IsString()
  @Type(() => String)
  password: string;

  @ApiProperty({
    description: "이름",
    example: "이교수",
  })
  @IsNotEmpty({ message: "이름을 입력해주세요." })
  @IsString()
  @Type(() => String)
  name: string;

  @ApiProperty({
    description: "이메일",
    example: "skku@skku.edu",
    required: false,
  })
  @IsOptional()
  @IsNotEmpty({ message: "이메일을 입력해주세요." })
  @IsEmail()
  @Type(() => String)
  email: string;

  @ApiProperty({
    description: "연락처",
    example: "010-1234-5678",
    required: false,
  })
  @IsOptional()
  @IsNotEmpty({ message: "연락처를 입력해주세요." })
  @IsString()
  @IsKoreanPhoneNumber()
  @Type(() => String)
  phone: string;

  @ApiProperty({
    description: "학과 아이디",
    example: 1,
  })
  @IsNotEmpty({ message: "학과 아이디를 입력해주세요." })
  @Type(() => Number)
  deptId: number;
}
