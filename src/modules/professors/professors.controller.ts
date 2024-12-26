import { ProfessorDto } from "./dtos/professor.dto";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UploadedFile, UseGuards } from "@nestjs/common";
import { ProfessorsService } from "./professors.service";
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { CreateProfessorDto } from "./dtos/create-professor.dto";
import { UpdateProfessorDto } from "./dtos/update-professor.dto";
import { ApiPaginationOKResponse } from "src/common/decorators/api-pagination-ok-response.decorator";
import { PageDto } from "src/common/dtos/pagination.dto";
import { ProfessorListPaginationQuery, ProfessorListQuery } from "./dtos/professors-list-query.dto";
import { ProfessorListDto } from "./dtos/professors-list.dto";
import { Response } from "express";
import { ApiFile } from "../files/decorators/api-file.decorator";
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";

@ApiTags("교수 API")
@UseGuards(JwtGuard)
@ApiBearerAuth("access-token")
@Controller("professors")
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Get("")
  @ApiOperation({
    summary: "교수 목록 조회",
    description: "교수 목록 조회",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  @ApiPaginationOKResponse({ description: "교수 목록 조회 성공", dto: ProfessorDto })
  async getProfessorsList(@Query() professorListPaginationQuery: ProfessorListPaginationQuery) {
    const { pageNumber, pageSize } = professorListPaginationQuery;
    const { totalCount, professors } = await this.professorsService.getProfessorsList(professorListPaginationQuery);
    const contents = professors.map((professor) => new ProfessorDto(professor));
    const pageDto = new PageDto(pageNumber, pageSize, totalCount, contents);
    return new CommonResponseDto(pageDto);
  }

  @Post("")
  @ApiOperation({
    summary: "교수 생성",
    description: "교수 생성",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOkResponse({
    description: "교수 생성 성공",
    type: ProfessorDto,
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async createProfessor(@Body() createProfessorDto: CreateProfessorDto) {
    const professor = await this.professorsService.createProfessor(createProfessorDto);

    return new CommonResponseDto(new ProfessorDto(professor));
  }

  @Delete("")
  @ApiOperation({
    summary: "교수 목록 삭제",
    description: "교수 목록 삭제",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async deleteProfessorsList() {
    await this.professorsService.deleteProfessorsList();

    return new CommonResponseDto();
  }

  @Post("/excel")
  @ApiFile("file", true)
  @ApiOperation({
    summary: "교수 엑셀 업로드",
    description: "교수 엑셀 업로드",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOkResponse({
    description: "교수 엑셀 업로드 성공",
    type: ProfessorListDto,
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async uploadProfessorExcel(@UploadedFile() excelFile: Express.Multer.File) {
    const professors = await this.professorsService.uploadProfessorExcel(excelFile);
    const contents = professors.map((professor) => new ProfessorDto(professor));

    return new CommonResponseDto(new ProfessorListDto(contents));
  }

  @Get("/excel")
  @ApiOperation({
    summary: "교수 엑셀 다운로드",
    description: "교수 엑셀 다운로드",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async downloadProfessorExcel(@Query() professorListQuery: ProfessorListQuery, @Res() res: Response) {
    const { stream, filename } = await this.professorsService.downloadProfessorExcel(professorListQuery);

    res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(filename)}`);
    stream.pipe(res);
  }

  @Get(":id")
  @ApiOperation({
    summary: "교수 조회",
    description: "교수 조회",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOkResponse({
    description: "교수 조회 성공",
    type: ProfessorDto,
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async getProfessor(@Param("id", PositiveIntPipe) id: number) {
    const professor = await this.professorsService.getProfessor(id);

    return new CommonResponseDto(new ProfessorDto(professor));
  }

  @Put(":id")
  @ApiOperation({
    summary: "교수 수정",
    description: "교수 수정",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async updateProfessor(@Param("id", PositiveIntPipe) id: number, @Body() updateProfessorDto: UpdateProfessorDto) {
    const professor = await this.professorsService.updateProfessor(id, updateProfessorDto);

    return new CommonResponseDto(new ProfessorDto(professor));
  }

  @Delete(":id")
  @ApiOperation({
    summary: "교수 삭제",
    description: "교수 삭제",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async deleteProfessor(@Param("id", PositiveIntPipe) id: number) {
    await this.professorsService.deleteProfessor(id);

    return new CommonResponseDto();
  }
}
