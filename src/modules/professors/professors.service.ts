import { BadRequestException, Injectable } from "@nestjs/common";
import { UserType } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";
import { CreateProfessorDto } from "./dtos/create-professor.dto";
import { AuthService } from "../auth/auth.service";
import { UpdateProfessorDto } from "./dtos/update-professor.dto";
import { ProfessorListPaginationQuery } from "./dtos/professors-list-pagination.dto";

@Injectable()
export class ProfessorsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

  async getProfessorsList(professorListPaginationQuery: ProfessorListPaginationQuery) {
    const { loginId, name, email, phone, deptId } = professorListPaginationQuery;

    if (deptId) {
      const checkDepartment = await this.prismaService.department.findUnique({
        where: { id: deptId },
      });

      if (!checkDepartment) {
        throw new BadRequestException("존재하지 않는 학과입니다.");
      }
    }
    return await this.prismaService.$transaction(async (tx) => {
      const professors = await tx.user.findMany({
        where: {
          type: UserType.PROFESSOR,
          loginId: { contains: loginId },
          name: { contains: name },
          email: { contains: email },
          phone: { contains: phone },
          deptId: deptId,
        },
        include: {
          department: true,
        },
        skip: professorListPaginationQuery.getOffset(),
        take: professorListPaginationQuery.getLimit(),
      });
      const totalCount = await tx.user.count({
        where: {
          type: UserType.PROFESSOR,
          loginId: { contains: loginId },
          name: { contains: name },
          email: { contains: email },
          phone: { contains: phone },
          deptId: deptId,
        },
      });
      return { totalCount, professors };
    });
  }

  async deleteProfessorsList() {
    return await this.prismaService.user.deleteMany({
      where: { type: UserType.PROFESSOR },
    });
  }

  async createProfessor(createProfessorDto: CreateProfessorDto) {
    const { loginId, password, email, deptId } = createProfessorDto;
    if (!loginId || !password || !email || !deptId) {
      throw new BadRequestException("필수 정보를 입력해주세요.");
    }

    const existingLoginId = await this.prismaService.user.findUnique({
      where: { loginId: loginId },
    });

    if (existingLoginId) {
      throw new BadRequestException("이미 존재하는 아이디입니다.");
    }

    const existingEmail = await this.prismaService.user.findUnique({
      where: { email: email },
    });

    if (existingEmail) {
      throw new BadRequestException("이미 존재하는 이메일입니다.");
    }

    const checkDepartment = await this.prismaService.department.findUnique({
      where: { id: deptId },
    });

    if (!checkDepartment) {
      throw new BadRequestException("존재하지 않는 학과입니다.");
    }

    const hashedPassword = await this.authService.createHash(createProfessorDto.password);

    return await this.prismaService.user.create({
      data: {
        ...createProfessorDto,
        type: UserType.PROFESSOR,
        password: hashedPassword,
      },
      include: {
        department: true,
      },
    });
  }

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

  async updateProfessor(id: number, updateProfessorDto: UpdateProfessorDto) {
    const { loginId, password, email, deptId } = updateProfessorDto;
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
    });

    if (!professor) throw new BadRequestException("존재하지 않는 교수입니다.");

    if (loginId) {
      const existingLoginId = await this.prismaService.user.findUnique({
        where: { loginId: updateProfessorDto.loginId },
      });
      if (existingLoginId) throw new BadRequestException("이미 존재하는 아이디입니다.");
    }

    if (password) {
      const hashedPassword = await this.authService.createHash(updateProfessorDto.password);
      updateProfessorDto.password = hashedPassword;
    }

    if (email) {
      const existingEmail = await this.prismaService.user.findUnique({
        where: { email: updateProfessorDto.email },
      });

      if (existingEmail) throw new BadRequestException("이미 존재하는 이메일입니다.");
    }

    if (deptId) {
      const checkDepartment = await this.prismaService.department.findUnique({
        where: { id: updateProfessorDto.deptId },
      });

      if (!checkDepartment) throw new BadRequestException("존재하지 않는 학과입니다.");
    }
    return await this.prismaService.user.update({
      where: { id },
      data: updateProfessorDto,
      include: {
        department: true,
      },
    });
  }

  async deleteProfessor(id: number) {
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
    });

    if (!professor) {
      throw new BadRequestException("존재하지 않는 교수입니다.");
    }

    return await this.prismaService.user.delete({
      where: { id },
    });
  }

  async uploadProfessorExcel() {}

  async downloadProfessorExcel() {}
}
