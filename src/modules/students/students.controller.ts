import { StudentsService } from "./students.service";
import { Controller, Get, Param, Post, Put, Query, Response, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { User, UserType } from "@prisma/client";
import { StudentDto } from "./dtos/student.dto";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { StudentPageQuery } from "./dtos/student-page-query.dto";
import { PageDto } from "src/common/dtos/pagination.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { GetStudentExcelQuery } from "./dtos/get-student-excel-query.dto";

@Controller("students")
@UseGuards(JwtGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @UseUserTypeGuard([UserType.ADMIN])
  async getStudentList(@Query() studentPageQuery: StudentPageQuery) {
    const { totalCount, students } = await this.studentsService.getStudentList(studentPageQuery);
    const contents = (await students).map((student) => new StudentDto(student));
    const pageDto = new PageDto(studentPageQuery.pageNumber, studentPageQuery.pageSize, totalCount, contents);
    return new CommonResponseDto(pageDto);
  }

  @Get("/excel")
  @UseUserTypeGuard([UserType.ADMIN])
  async getStudentExcel(@Query() studentExcelQuery: GetStudentExcelQuery, @Response() res) {
    const { fileName, stream } = await this.studentsService.getStudentExcel(studentExcelQuery);

    res.setHeader(`Content-Disposition`, `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @Get("/:id")
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT])
  async getStudent(@Param("id", PositiveIntPipe) studentId: number, @CurrentUser() user: User) {
    const student = await this.studentsService.getStudent(studentId, user);
    const studentDto = new StudentDto(student);
    return new CommonResponseDto(studentDto);
  }

  @Post()
  @UseUserTypeGuard([UserType.ADMIN])
  async createStudent() {
    return "createStudent";
  }

  @Post("/excel")
  @UseUserTypeGuard([UserType.ADMIN])
  async createStudentExcel() {
    return "createStudentExcel";
  }

  @Put()
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT])
  async updateStudent() {
    return "updateStudent";
  }
}
