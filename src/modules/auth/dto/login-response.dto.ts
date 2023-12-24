import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "../../../common/dtos/swagger-response.dto";

export abstract class LoginResponseDto extends BaseResponseDto {
  @ApiProperty()
  accessToken: string;
}
