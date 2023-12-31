import { Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ProfessorsService } from "./professors.service";
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";

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
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async getProfessorsList() {}

  @Get(":id")
  @ApiOperation({
    summary: "교수 조회",
    description: "교수 조회",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async getProfessor(@Param("id", ParseIntPipe) id: number) {}

  @Post("")
  @ApiOperation({
    summary: "교수 생성",
    description: "교수 생성",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async createProfessor() {}

  @Put(":id")
  @ApiOperation({
    summary: "교수 수정",
    description: "교수 수정",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async updateProfessor(@Param("id", ParseIntPipe) id: number) {}

  @Post("")
  @ApiOperation({
    summary: "교수 엑셀 업로드",
    description: "교수 엑셀 업로드",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async uploadProfessorExcel() {}

  @Get("")
  @ApiOperation({
    summary: "교수 엑셀 다운로드",
    description: "교수 엑셀 다운로드",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async downloadProfessorExcel() {}
}
