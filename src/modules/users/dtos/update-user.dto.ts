import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @ApiProperty({ description: "수정할 이메일" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "수정할 비밀번호" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: "수정할 전화번호" })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phone: string;
}
