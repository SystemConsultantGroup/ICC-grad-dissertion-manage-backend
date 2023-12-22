import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { CreateDepartmentDto } from "./dtos/create-deparment.dto";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { JwtGuard } from "../auth/guards/jwt.guard";

@UseUserTypeGuard([UserType.ADMIN])
@UseGuards(JwtGuard)
@ApiTags("departments API")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get("")
  @ApiOperation({
    summary: "Get all departments",
    description: "Get all departments",
  })
  @ApiBadRequestResponse({ description: "Bad Request" })
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async getAllDepartments() {
    return new CommonResponseDto(await this.departmentsService.getAllDepartments());
  }

  @Post("")
  @ApiOperation({
    summary: "Create a department",
    description: "Create a department",
  })
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    return new CommonResponseDto(await this.departmentsService.createDepartment(createDepartmentDto));
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a department",
    description: "Delete a department",
  })
  @ApiInternalServerErrorResponse({ description: "Internal Server Error" })
  async deleteDepartment(@Param("id", ParseIntPipe) id: number) {
    return new CommonResponseDto(await this.departmentsService.deleteDepartment(id));
  }
}
