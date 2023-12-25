import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

  async getMe(currentUser: User) {
    const userInfo = this.prismaService.user.findUnique({
      where: { id: currentUser.id },
      include: { department: true },
    });
    return userInfo;
  }

  async updateMe(updateUserDto: UpdateUserDto, currentUser: User) {
    const { email, password, phone } = updateUserDto;

    // 중복 이메일 확인
    if (email) {
      const foundUser = await this.prismaService.user.findUnique({ where: { email } });
      if (foundUser) throw new BadRequestException("중복 이메일입니다.");
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        return await tx.user.update({
          where: { id: currentUser.id },
          data: {
            email: email ? email : undefined,
            phone: phone ? phone : undefined,
            password: password ? this.authService.createHash(password) : undefined,
          },
          include: { department: true },
        });
      });
    } catch (e) {
      throw new InternalServerErrorException("유저 업데이트 문제 발생");
    }
  }
}
