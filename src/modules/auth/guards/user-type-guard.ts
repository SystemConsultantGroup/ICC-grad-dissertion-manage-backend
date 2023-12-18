import {
  CanActivate,
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const allowTypes: UserType[] = this.reflector.get(
      'types',
      context.getHandler(),
    );

    const { loginId, type } = request.user;

    if (!allowTypes.includes(type))
      throw new ForbiddenException('올바른 접근이 아닙니다');

    return true;
  }
}
