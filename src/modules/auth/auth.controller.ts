import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login-request.dto";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { UseUserTypeGuard } from "./decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { ApiBadRequestResponse, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LoginResponseDto } from "./dto/login-response.dto";
import { JwtGuard } from "./guards/jwt.guard";
import { PositiveIntPipe } from "../../common/pipes/positive-int.pipe";

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
  @ApiBadRequestResponse({ description: "로그인 오류" })
  async login(@Body() loginRequsetDto: LoginRequestDto) {
    const accessToken = await this.authService.login(loginRequsetDto);
    return new CommonResponseDto({
      accessToken,
    });
  }

  @UseUserTypeGuard([UserType.ADMIN])
  @UseGuards(JwtGuard)
  @Get(":id")
  @ApiOperation({ summary: "특정 계정으로 로그인" })
  @ApiResponse({ description: "특정 계정 로그인 성공", type: LoginResponseDto, status: 200 })
  @ApiBadRequestResponse({ description: "로그인 오류" })
  async loginUser(@Param("id", PositiveIntPipe) id: number) {
    const accessToken = await this.authService.loginUser(id);

    return new CommonResponseDto({
      accessToken,
    });
  }
}
