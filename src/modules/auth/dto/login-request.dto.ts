import { UserType } from "@prisma/client";
import { IsString, IsNotEmpty, IsEnum } from "class-validator";

export class LoginRequestDto {
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;
}
