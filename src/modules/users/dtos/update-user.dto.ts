import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

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

  @ApiProperty({
    description: "교수 서명 이미지 uuid",
    required: false,
    example: "51d9c260-b7a0-11ee-a457-2f01a349adf8",
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  signId: string;
}
