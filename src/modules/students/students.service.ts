import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getStudentList() {
    return 'STUDENT LIST';
  }

  async getStudent(studentId: string) {
    return `STUDENT INFO: ${studentId}`;
  }

  async getStudentExcel() {
    return 'EXCEL FORM';
  }

  async createStudent() {
    return 'CREATED STUDENT';
  }

  async createStudentExcel() {
    return 'CREATED STUDENTS';
  }

  async updateStudent() {
    return 'UPDATED STUDENT';
  }
}
