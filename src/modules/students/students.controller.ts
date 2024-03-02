import { StudentsService } from "./students.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Response,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
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
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
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
import { SystemDto } from "./dtos/system.dto";
import { UpdateSystemDto } from "./dtos/update-system.dto";
import { ThesisInfoQueryDto } from "./dtos/thesis-info-query.dto";
import { ThesisInfoDto } from "./dtos/thesis-info.dto";
import { UpdateThesisInfoDto } from "./dtos/update-thesis-info.dto";
import { ReviewersDto } from "./dtos/reviewers.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { ExcelFilter } from "src/common/pipes/excel.filter";
import { UpdateReviewerQueryDto } from "./dtos/update-reviewer-query-dto";

@Controller("students")
@UseGuards(JwtGuard)
@ApiTags("학생 API")
@ApiExtraModels(UserDto, CommonResponseDto, SystemDto, ThesisInfoDto, ReviewersDto)
@ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
@ApiBearerAuth("access-token")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // 학생 생성 API
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
  @UseInterceptors(FileInterceptor("file", { fileFilter: ExcelFilter }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOperation({
    summary: "학생 엑셀 업로드 API",
    description: "엑셀을 업로드하여 학생을 생성한다. 학번 기준 기존 학생인 경우 업데이트를 진행한다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "엑셀 양식 오류" })
  @ApiCreatedResponse({
    description: "생성 및 업데이트 성공",
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        { $ref: getSchemaPath(PageDto) },
        {
          properties: {
            content: {
              type: "array",
              items: { $ref: getSchemaPath(UserDto) },
            },
          },
        },
      ],
    },
  })
  async createStudentExcel(@UploadedFile() excelFile: Express.Multer.File) {
    const students = await this.studentsService.createStudentExcel(excelFile);
    const contents = students.map((student) => new UserDto(student));
    const pageDto = new PageDto(0, 0, contents.length, contents);
    return new CommonResponseDto(pageDto);
  }

  // 학생 대량 조회 API
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

  // 학생 기본 정보 조회/수정 API
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

  // 학생 시스템 정보 조회/수정 API
  @Get("/:id/system")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 시스템 정보 조회 API",
    description: "아이디에 해당하는 학생의 시스템 단계를 조회할 수 있다.",
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
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 시스템 정보 수정 API",
    description: "에심 학생을 본심으로 업데이트 할 수 있다. 새로운 논문 정보, 지도 관계, 논문 심사 정보를 생성한다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiOkResponse({
    description: "학생 시스템 정보 수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(SystemDto) }],
    },
  })
  async updateStudentSystem(@Param("id", PositiveIntPipe) studentId: number, @Body() updateSystemDto: UpdateSystemDto) {
    const updatedSystem = await this.studentsService.updateStudentSystem(studentId, updateSystemDto);
    const systemDto = new SystemDto(updatedSystem);
    return new CommonResponseDto(systemDto);
  }

  // 학생 논문 정보 조회/수정 API
  @Get("/:id/thesis")
  @UseUserTypeGuard([UserType.ADMIN, UserType.PROFESSOR, UserType.STUDENT])
  @ApiOperation({
    summary: "학생 논문 정보 조회 API",
    description: "아이디에 해당하는 학생의 예심/본심 논문 정보를 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({
    description: "로그인 후 접근 가능, [학생] 본인 정보만 조회 가능, [교수] 담당 학생 정보만 조회 가능",
  })
  @ApiBadRequestResponse({ description: "요청 양식 오류" })
  @ApiNotFoundResponse({ description: "쿼리에 해당하는 단계의 논문 정보 없음" })
  @ApiOkResponse({
    description: "학생 논문 정보 조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ThesisInfoDto) }],
    },
  })
  async getThesisInfo(
    @Param("id", PositiveIntPipe) studentId: number,
    @Query() thesisInfoQuery: ThesisInfoQueryDto,
    @CurrentUser() currentUser: User
  ) {
    const thesisInfo = await this.studentsService.getThesisInfo(studentId, thesisInfoQuery, currentUser);
    const thesisInfoDto = new ThesisInfoDto(thesisInfo);
    return new CommonResponseDto(thesisInfoDto);
  }

  @Put("/:id/thesis")
  @UseUserTypeGuard([UserType.STUDENT])
  @ApiOperation({
    summary: "학생 논문 정보 수정 API(학생용)",
    description:
      "아이디에 해당하는 학생의 현재 단계에 해당하는 논문 정보를 수정할 수 있다.\n\n'논문 제목', '논문 초록', '논문 파일', '발표 파일', '수정지시사항 보고서' 수정 가능",
  })
  @ApiUnauthorizedResponse({ description: "[학생] 로그인 후 접근 가능, 학생은 본인의 정보만 수정 가능" })
  @ApiBadRequestResponse({ description: "잘못된 요청'" })
  @ApiOkResponse({
    description: "학생 논문 정보 수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ThesisInfoDto) }],
    },
  })
  async updateThesisInfo(
    @Param("id", PositiveIntPipe) studentId: number,
    @Body() updateThesisInfoDto: UpdateThesisInfoDto,
    @CurrentUser() currentUser: User
  ) {
    const updatedThesisInfo = await this.studentsService.updateThesisInfo(studentId, updateThesisInfoDto, currentUser);
    const thesisInfoDto = new ThesisInfoDto(updatedThesisInfo);
    return new CommonResponseDto(thesisInfoDto);
  }

  // 학생 지도 정보 조회/수정/삭제 API
  @Get("/:id/reviewers")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 지도 정보 조회 API",
    description: "아이디에 해당하는 학생의 심사위원장, 지도 교수, 심사위원을 조회할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "잘못된 요청" })
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ReviewersDto) }],
    },
  })
  async getReviewerList(@Param("id", PositiveIntPipe) studentId: number) {
    const { headReviewer, advisors, committees } = await this.studentsService.getReviewerList(studentId);
    const reviewersDto = new ReviewersDto(headReviewer, advisors, committees);
    return new CommonResponseDto(reviewersDto);
  }

  @Post("/:id/reviewers/:reviewerId")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "지도교수/심사위원 배정 추가 API",
    description: "심사위원/지도교수를 추가할 수 있다. 단, 이미 심사위원/지도교수가 2명이라면 불가하다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "잘못된 요청" })
  @ApiCreatedResponse({
    description: "추가 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ReviewersDto) }],
    },
  })
  async updateReviewer(
    @Param("id", PositiveIntPipe) studentId: number,
    @Param("reviewerId", PositiveIntPipe) reviewerId: number,
    @Query() updateReviewrQuery: UpdateReviewerQueryDto
  ) {
    const { headReviewer, advisors, committees } = await this.studentsService.updateReviewer(
      studentId,
      reviewerId,
      updateReviewrQuery
    );
    const reviewersDto = new ReviewersDto(headReviewer, advisors, committees);
    return new CommonResponseDto(reviewersDto);
  }

  @Delete("/:id/reviewers/:reviewerId")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "심사위원/지도교수 배정 취소 API",
    description:
      "기존에 배정된 심사위원/지도교수를 배정 취소할 수 있다. 단, 심사위원/지도교수가 한 명일 때는 불가능하다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "잘못된 요청" })
  @ApiOkResponse({
    description: "배정 취소 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ReviewersDto) }],
    },
  })
  async deleteReviewer(
    @Param("id", PositiveIntPipe) studentId: number,
    @Param("reviewerId", PositiveIntPipe) reviewerId: number
  ) {
    const { headReviewer, advisors, committees } = await this.studentsService.deleteReviewer(studentId, reviewerId);
    const reviewersDto = new ReviewersDto(headReviewer, advisors, committees);
    return new CommonResponseDto(reviewersDto);
  }

  @Put("/:id/headReviewer/:headReviewerId")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "심사위원장 교체 API",
    description: "심사위원장을 교체할 수 있다.",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "잘못된 요청" })
  @ApiOkResponse({
    description: "교체 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ReviewersDto) }],
    },
  })
  async updateHeadReviewer(
    @Param("id", PositiveIntPipe) studentId: number,
    @Param("headReviewerId", PositiveIntPipe) headReviewerId: number
  ) {
    const { headReviewer, advisors, committees } = await this.studentsService.updateHeadReviewer(
      studentId,
      headReviewerId
    );
    const reviewersDto = new ReviewersDto(headReviewer, advisors, committees);
    return new CommonResponseDto(reviewersDto);
  }
}
