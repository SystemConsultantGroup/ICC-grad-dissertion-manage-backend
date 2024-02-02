import { PrismaService } from "src/config/database/prisma.service";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateDepartmentDto } from "./dtos/create-department.dto";
import { UpdateDepartmentQuery } from "./dtos/update-department-query.dto";

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

  async updateDepartment(id: number, updateDepartmentQuery: UpdateDepartmentQuery) {
    const modificationFlag = updateDepartmentQuery.exclude === "true" ? true : false;
    try {
      const department = await this.prismaService.department.update({
        where: {
          id,
        },
        data: {
          modificationFlag,
        },
      });
      if (!department) throw new BadRequestException("해당 학과id를 가진 학과는 존재하지 않습니다.");
    } catch (e) {
      throw new InternalServerErrorException("수정 지시사항 제출 학과 수정에 실패했습니다.");
    }
  }
}
