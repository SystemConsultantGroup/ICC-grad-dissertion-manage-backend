import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(loginRequsetDto: LoginRequestDto) {
    const user: User = await this.prisma.user.findUnique({
      where: {
        loginId: loginRequsetDto.loginId,
      },
    });

    if (
      !user ||
      !(await bcrypt.compare(loginRequsetDto.password, user.password))
    ) {
      throw new UnauthorizedException('학번이나 비밀번호가 올바르지 않습니다');
    }

    return this.jwt.sign({
      loginId: user.loginId,
      type: user.type,
    });
  }

  createHash(password: string) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
  }
}
