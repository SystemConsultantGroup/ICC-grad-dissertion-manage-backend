import { BadRequestException, Injectable } from "@nestjs/common";
import { UserType } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";
import { CreateProfessorDto } from "./dtos/create-professor.dto";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class ProfessorsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

  async getProfessorsList() {}

  async getProfessor(id: number) {
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
      include: {
        department: true,
      },
    });

    if (!professor) {
      throw new BadRequestException("존재하지 않는 교수입니다.");
    }

    return professor;
  }

  async createProfessor(createProfessorDto: CreateProfessorDto) {
    const existingLoginId = await this.prismaService.user.findUnique({
      where: { loginId: createProfessorDto.loginId },
    });

    if (existingLoginId) {
      throw new BadRequestException("이미 존재하는 아이디입니다.");
    }

    const existingEmail = await this.prismaService.user.findUnique({
      where: { email: createProfessorDto.email },
    });

    if (existingEmail) {
      throw new BadRequestException("이미 존재하는 이메일입니다.");
    }

    const checkDepartment = await this.prismaService.department.findUnique({
      where: { id: createProfessorDto.deptId },
    });

    if (!checkDepartment) {
      throw new BadRequestException("존재하지 않는 학과입니다.");
    }

    const hashedPassword = await this.authService.createHash(createProfessorDto.password);

    return await this.prismaService.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          ...createProfessorDto,
          type: UserType.PROFESSOR,
          password: hashedPassword,
        },
      });

      return await tx.user.findUnique({
        where: { loginId: createProfessorDto.loginId },
        include: {
          department: true,
        },
      });
    });
  }

  async updateProfessor(id: number) {}

  async uploadProfessorExcel() {}

  async downloadProfessorExcel() {}
}
