import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "@prisma/client";
import { IsString, IsNotEmpty, IsEnum } from "class-validator";

export class LoginRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsEnum(UserType)
  @IsNotEmpty()
  type: UserType;
}
