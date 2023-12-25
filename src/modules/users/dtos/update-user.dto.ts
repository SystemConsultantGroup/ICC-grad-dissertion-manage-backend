import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @ApiProperty({ description: "수정할 이메일", example: "email@gmail.com" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "수정할 비밀번호", example: "1111" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: "수정할 전화번호", example: "01098769876" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phone: string;
}
