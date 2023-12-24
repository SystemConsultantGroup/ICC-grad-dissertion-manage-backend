import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login-request.dto";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { UseUserTypeGuard } from "./decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LoginResponseDto } from "./dto/login-response.dto";

@ApiTags("Auth(로그인) API")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post()
  @ApiOperation({ summary: "로그인" })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    description: "로그인 성공",
    type: LoginResponseDto,
    status: 201,
  })
  async login(@Body() loginRequsetDto: LoginRequestDto) {
    const accessToken = await this.authService.login(loginRequsetDto);
    return new CommonResponseDto({
      accessToken,
    });
  }

  @UseUserTypeGuard([UserType.ADMIN])
  @Get(":id")
  async loginUser(@Param("id") id: string) {
    const accessToken = await this.authService.loginUser(id);

    return new CommonResponseDto({
      accessToken,
    });
  }
}
