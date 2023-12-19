import { Body, Controller, Post } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { AuthService } from './auth.service';

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
}
