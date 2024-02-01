import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { CreateDepartmentDto } from "./dtos/create-department.dto";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetDepartmentsDto } from "./dtos/get-departments.dto";
import { DepartmentDto } from "./dtos/department.dto";
import { UpdateDepartmentQuery } from "./dtos/update-department-query.dto";

@ApiTags("학과 API")
@UseGuards(JwtGuard)
@ApiBearerAuth("access-token")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get("")
  @ApiOperation({
    summary: "학과 리스트 조회",
    description: "학과 리스트 조회",
  })
  @UseUserTypeGuard([UserType.ADMIN, UserType.PROFESSOR])
  @ApiOkResponse({
    description: "학과 리스트 조회 성공",
    type: GetDepartmentsDto,
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async getAllDepartments() {
    const departments = await this.departmentsService.getAllDepartments();

    return new CommonResponseDto(new GetDepartmentsDto(departments));
  }

  @Post("")
  @ApiOperation({
    summary: "학과 생성",
    description: "학과 생성",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOkResponse({
    description: "학과 생성 성공",
    type: DepartmentDto,
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentsService.createDepartment(createDepartmentDto);

    return new CommonResponseDto(department);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "학과 삭제",
    description: "학과 삭제",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async deleteDepartment(@Param("id", ParseIntPipe) id: number) {
    await this.departmentsService.deleteDepartment(id);

    return new CommonResponseDto();
  }

  @Put(":id")
  @ApiOperation({
    summary: "수정 지시사항 학과 수정",
    description: "Querystring의 exclud boolean값에 따라서 수정 지시사항 학과에서 제외/제외 취소를 결정합니다.",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
  async updateDepartment(@Param("id", ParseIntPipe) id: number, @Query() updateDepartmentQuery: UpdateDepartmentQuery) {
    await this.departmentsService.updateDepartment(id, updateDepartmentQuery);

    return new CommonResponseDto();
  }
}
