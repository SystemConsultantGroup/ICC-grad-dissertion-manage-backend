import { StudentsService } from "./students.service";
import { Body, Controller, Get, Param, Post, Put, Query, Response, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { User, UserType } from "@prisma/client";
import { StudentDto } from "./dtos/student.dto";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { PageDto } from "src/common/dtos/pagination.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { CreateStudentDto } from "./dtos/create-student.dto";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { StudentSearchPageQuery } from "./dtos/student-search-page-query.dto";
import { StudentSearchQuery } from "./dtos/student-search-query.dto";

@Controller("students")
@UseGuards(JwtGuard)
@ApiTags("학생 API")
@ApiExtraModels(PageDto, StudentDto, CommonResponseDto)
@ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
@ApiBearerAuth("access-token")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 리스트 조회 API",
    description: "모든 학생 리스트를 조회한다. 학생 회원 정보와 시스템 단계 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "학과 ID 또는 시스템 단계 ID 오류" })
  @ApiOkResponse({
    description: "학생 리스트 조회 성공",
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        { $ref: getSchemaPath(PageDto) },
        {
          properties: {
            contents: {
              type: "array",
              items: { $ref: getSchemaPath(StudentDto) },
            },
          },
        },
      ],
    },
  })
  async getStudentList(@Query() studentPageQuery: StudentSearchPageQuery) {
    const { totalCount, students } = await this.studentsService.getStudentList(studentPageQuery);
    const contents = (await students).map((student) => new StudentDto(student));
    const pageDto = new PageDto(studentPageQuery.pageNumber, studentPageQuery.pageSize, totalCount, contents);
    return new CommonResponseDto(pageDto);
  }

  @Get("/excel")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 리스트 엑셀 다운로드 API",
    description:
      "모든 학생 리스트를 엑셀 형태로 다운로드 받는다. 학생 회원 정보, 논문 정보, 배정 교수, 시스템 단계 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "학과 ID 또는 시스템 단계 ID 오류" })
  async getStudentExcel(@Query() studentExcelQuery: StudentSearchQuery, @Response() res) {
    const { fileName, stream } = await this.studentsService.getStudentExcel(studentExcelQuery);

    res.setHeader(`Content-Disposition`, `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @Get("/:id")
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT])
  @ApiOperation({
    summary: "단일 학생 조회 API",
    description: "아이디에 해당하는 학생의 회원 정보와 시스템 단계 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "학과 ID 또는 시스템 단계 ID 오류" })
  @ApiOkResponse({
    description: "단일 학생 조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(StudentDto) }],
    },
  })
  async getStudent(@Param("id", PositiveIntPipe) studentId: number, @CurrentUser() user: User) {
    const student = await this.studentsService.getStudent(studentId, user);
    const studentDto = new StudentDto(student);
    return new CommonResponseDto(studentDto);
  }

  @Post()
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 생성 API",
    description:
      "학생의 회원 정보, 논문 과정 정보, 심사 위원 정보, 논문 정보를 생성한다. 학생의 회원 가입 역할을 한다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "학과 ID 또는 시스템 단계 ID 오류" })
  @ApiCreatedResponse({
    description: "학생 생성 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(StudentDto) }],
    },
  })
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    const student = await this.studentsService.createStudent(createStudentDto);
    const studentDto = new StudentDto(student);
    return new CommonResponseDto(studentDto);
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
