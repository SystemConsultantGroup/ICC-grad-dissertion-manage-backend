import { PrismaService } from "src/config/database/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateDepartmentDto } from "./dtos/create-department.dto";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prismaService: PrismaService) {}
  async getAllDepartments() {
    const departments = await this.prismaService.department.findMany({
      include: {
        users: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return departments.map(({ users, ...department }) => ({
      ...department,
      userCount: users.length,
    }));
  }

  async createDepartment(createDepartmentDto: CreateDepartmentDto) {
    const department = await this.prismaService.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (department) {
      throw new BadRequestException("이미 존재하는 학과입니다.");
    }

    return this.prismaService.department.create({
      data: createDepartmentDto,
    });
  }

  async deleteDepartment(id: number) {
    const department = await this.prismaService.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new BadRequestException("존재하지 않는 학과입니다.");
    }

    return this.prismaService.department.delete({
      where: { id },
    });
  }
}
