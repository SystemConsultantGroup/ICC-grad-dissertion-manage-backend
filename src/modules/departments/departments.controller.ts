import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { CreateDepartmentDto } from "./dtos/create-department.dto";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetDepartmentsResponseDto } from "./dtos/get-departments.dto";

@ApiBearerAuth("access-token")
@ApiTags("학과 API")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get("")
  @ApiOperation({
    summary: "학과 조회",
    description: "학과 조회",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @UseGuards(JwtGuard)
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async getAllDepartments() {
    const departments = await this.departmentsService.getAllDepartments();

    return new CommonResponseDto(new GetDepartmentsResponseDto(departments));
  }

  @Post("")
  @ApiOperation({
    summary: "학과 생성",
    description: "학과 생성",
  })
  @UseUserTypeGuard([UserType.ADMIN])
  @UseGuards(JwtGuard)
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
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
  @UseGuards(JwtGuard)
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async deleteDepartment(@Param("id", ParseIntPipe) id: number) {
    await this.departmentsService.deleteDepartment(id);

    return new CommonResponseDto();
  }
}
