import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMe(currentUser: User) {
    const userInfo = this.prismaService.user.findUnique({
      where: { id: currentUser.id },
      include: { department: true },
    });
    return userInfo;
  }

  async postAdmin() {}
}
