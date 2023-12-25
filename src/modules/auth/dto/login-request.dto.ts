import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class LoginRequestDto {
  @ApiProperty({ example: "admin", required: true })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ example: "123", required: true })
  @IsNotEmpty()
  @IsString()
  password: string;
}
