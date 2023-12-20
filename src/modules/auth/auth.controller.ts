import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { AuthService } from './auth.service';
import { CommonResponseDto } from '../../common/dtos/common-response.dto';
import { UseUserTypeGuard } from './decorators/user-type-guard.decorator';
import { UserType } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() loginRequsetDto: LoginRequestDto) {
    const accessToken = await this.authService.login(loginRequsetDto);

    return new CommonResponseDto({
      accessToken,
    });
  }

  @UseUserTypeGuard([UserType.ADMIN])
  @Get(':id')
  async loginUser(@Param('id') id: string) {
    const accessToken = await this.authService.loginUser(id);

    return new CommonResponseDto({
      accessToken,
    });
  }
}
