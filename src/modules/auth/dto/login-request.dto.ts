import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class LoginRequestDto {
  @ApiProperty({ example: "admin" })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ example: "123" })
  @IsNotEmpty()
  @IsString()
  password: string;
}
