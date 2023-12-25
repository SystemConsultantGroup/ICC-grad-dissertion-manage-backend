import { StudentsService } from "./students.service";
import { Body, Controller, Get, Param, Post, Put, Query, Response, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { User, UserType } from "@prisma/client";
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
import { ApiPaginationOKResponse } from "src/common/decorators/api-pagination-ok-response.decorator";
import { UserDto } from "../users/dtos/user.dto";
import { UpdateStudentDto } from "./dtos/update-student.dto";
import { PhaseDto } from "../phases/dtos/phase.dto";
import { SystemDto } from "./dtos/system.dto";

@Controller("students")
@UseGuards(JwtGuard)
@ApiTags("학생 API")
@ApiExtraModels(UserDto, CommonResponseDto, SystemDto)
@ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
@ApiBearerAuth("access-token")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 생성 API",
    description:
      "학생의 회원 정보, 논문 과정 정보, 심사 위원 정보, 논문 정보를 생성한다. 학생의 회원 가입 역할을 한다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiCreatedResponse({
    description: "학생 생성 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(UserDto) }],
    },
  })
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    const student = await this.studentsService.createStudent(createStudentDto);
    const userDto = new UserDto(student);
    return new CommonResponseDto(userDto);
  }

  @Post("/excel")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({ summary: "개발중" })
  async createStudentExcel() {
    return "createStudentExcel";
  }

  @Get("/excel")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 리스트 엑셀 다운로드 API",
    description:
      "모든 학생 리스트를 엑셀 형태로 다운로드 받는다. 학생 회원 정보, 논문 정보, 배정 교수, 시스템 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiOkResponse({ description: "엑셀 다운로드 성공" })
  async getStudentExcel(@Query() studentExcelQuery: StudentSearchQuery, @Response() res) {
    const { fileName, stream } = await this.studentsService.getStudentExcel(studentExcelQuery);

    res.setHeader(`Content-Disposition`, `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @Get()
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 리스트 조회 API",
    description: "모든 학생 리스트를 조회한다. 학생 회원 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiPaginationOKResponse({ description: "학생 리스트 조회 성공", dto: UserDto })
  async getStudentList(@Query() studentPageQuery: StudentSearchPageQuery) {
    const { totalCount, students } = await this.studentsService.getStudentList(studentPageQuery);
    const contents = students.map((student) => new UserDto(student));
    const pageDto = new PageDto(studentPageQuery.pageNumber, studentPageQuery.pageSize, totalCount, contents);
    return new CommonResponseDto(pageDto);
  }

  @Get("/:id")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 회원 정보 조회 API",
    description: "아이디에 해당하는 학생의 회원 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiOkResponse({
    description: "학생 회원 정보 조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(UserDto) }],
    },
  })
  async getStudent(@Param("id", PositiveIntPipe) studentId: number) {
    const student = await this.studentsService.getStudent(studentId);
    const userDto = new UserDto(student);
    return new CommonResponseDto(userDto);
  }

  @Put("/:id")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 회원 정보 수정 API",
    description: "아이디에 해당하는 학생의 회원 정보를 수정할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiOkResponse({
    description: "학생 회원 정보 수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(UserDto) }],
    },
  })
  async updateStudent(@Param("id", PositiveIntPipe) studentId: number, @Body() updateStudentDto: UpdateStudentDto) {
    const updateStudent = await this.studentsService.updateStudent(studentId, updateStudentDto);
    const userDto = new UserDto(updateStudent);
    return new CommonResponseDto(userDto);
  }

  @Get("/:id/system")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 시스템 정보 조회 API",
    description: "아이디에 해당하는 학생의 시스템 단계와 시스템 락 여부를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiOkResponse({
    description: "학생 시스템 정보 조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(SystemDto) }],
    },
  })
  async getStudentSystem(@Param("id", PositiveIntPipe) studentId: number) {
    const systemInfo = await this.studentsService.getStudentSystem(studentId);
    const systemDto = new SystemDto(systemInfo);
    return new CommonResponseDto(systemDto);
  }

  @Put("/:id/system")
  async updateStudentSystem() {
    return "get student system";
  }
}
