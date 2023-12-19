import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { AuthService } from './auth.service';
import { UseUserTypeGuard } from './decorators/user-type-guard.decorator';
import { UserType } from '../../common/enums/user-type.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() loginRequestDto: LoginRequestDto) {
    return await this.authService.login(loginRequestDto);
  }

  @UseUserTypeGuard([UserType.ADMIN])
  @Get()
}
