import { ProfessorDto } from "./dtos/professor.dto";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
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
  async getProfessorsList() {}

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
  async getProfessor(@Param("id", ParseIntPipe) id: number) {
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
  async updateProfessor(@Param("id", ParseIntPipe) id: number, @Body() updateProfessorDto: UpdateProfessorDto) {
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
  async deleteProfessor(@Param("id", ParseIntPipe) id: number) {
    await this.professorsService.deleteProfessor(id);

    return new CommonResponseDto();
  }

  @Post("/excel")
  @ApiOperation({
    summary: "교수 엑셀 업로드",
    description: "교수 엑셀 업로드",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async uploadProfessorExcel() {}

  @Get("/excel")
  @ApiOperation({
    summary: "교수 엑셀 다운로드",
    description: "교수 엑셀 다운로드",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async downloadProfessorExcel() {}
}
