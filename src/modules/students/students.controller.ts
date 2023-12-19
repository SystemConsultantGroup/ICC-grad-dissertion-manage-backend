import { StudentsService } from './students.service';
import { Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('students')
// @UseGuards(JwtGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async getStudentList() {
    return this.studentsService.getStudentList();
  }

  @Get('/:id')
  async getStudent(@Param('id') studentId: string) {
    // studentId Pipe 적용
    // 가드 확인
    // DTO 작성
    return this.studentsService.getStudent(studentId);
  }

  @Get('/excel')
  async getStudentExcel() {
    return 'getStudentExcel';
  }

  @Post()
  async createStudent() {
    return 'createStudent';
  }

  @Post('/excel')
  async createStudentExcel() {
    return 'createStudentExcel';
  }

  @Put()
  async updateStudent() {
    return 'updateStudent';
  }
}
