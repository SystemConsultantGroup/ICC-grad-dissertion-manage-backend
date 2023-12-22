import { PrismaService } from 'src/config/database/prisma.service';
import { Injectable } from "@nestjs/common";
import { CreateDepartmentDto } from './dtos/create-deparment.dto';

@Injectable()
export class DepartmentsService {
    constructor(private readonly prismaService: PrismaService) {}
    async getAllDepartments() {
        return this.prismaService.department.findMany();
    }

    async createDepartment(createDepartmentDto: CreateDepartmentDto) {
        return this.prismaService.department.create({
            data: createDepartmentDto,
        });
    }

    async deleteDepartment(id: number) {
        return this.prismaService.department.delete({
            where: { id },
        });
    }
}
