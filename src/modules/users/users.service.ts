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
    return await this.prismaService.user.findUnique({
      where: { id: currentUser.id },
      include: {
        department: true,
        signFile: true,
        studentProcess: true,
      },
    });
  }

  async updateMe(updateUserDto: UpdateUserDto, currentUser: User) {
    const { email, password, phone, signId } = updateUserDto;

    // 중복 이메일 확인
    if (email) {
      const foundUser = await this.prismaService.user.findUnique({ where: { email } });
      if (foundUser) throw new BadRequestException("중복 이메일입니다.");
    }
    // 파일 존재 확인
    if (signId) {
      const foundFile = await this.prismaService.file.findUnique({ where: { uuid: signId } });
      if (!foundFile) throw new BadRequestException("서명 이미지 파일을 찾을 수 없습니다.");
    }

    try {
      return await this.prismaService.user.update({
        where: { id: currentUser.id },
        data: {
          email: email,
          phone: phone,
          password: password ? this.authService.createHash(password) : undefined,
          signId: signId,
        },
        include: {
          department: true,
          signFile: true,
          studentProcess: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`유저 업데이트 문제 발생 : ${error.message}`);
    }
  }
}
