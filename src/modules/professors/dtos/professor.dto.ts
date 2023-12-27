import { ApiProperty } from "@nestjs/swagger";
import { Department, User } from "@prisma/client";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { DepartmentDto } from "src/modules/departments/dtos/department.dto";

export class ProfessorDto {
  constructor(
    professor: User & {
      department: Department;
    }
  ) {
    this.id = professor.id;
    this.loginId = professor.loginId;
    this.name = professor.name;
    this.email = professor.email;
    this.phone = professor.phone;
    this.department = professor.department;
    this.createdAt = professor.createdAt;
    this.updatedAt = professor.updatedAt;
  }

  @ApiProperty({ description: "아이디" })
  @Type(() => Number)
  id: number;
  @ApiProperty({ description: "로그인 아이디" })
  @Type(() => String)
  loginId: string;
  @ApiProperty({ description: "이름" })
  @Type(() => String)
  name: string;
  @ApiProperty({ description: "이메일" })
  @Type(() => String)
  email: string;
  @ApiProperty({ description: "연락처" })
  @Type(() => String)
  @IsOptional()
  phone?: string;
  @ApiProperty({ description: "학과", type: () => DepartmentDto })
  department: DepartmentDto;
  @ApiProperty({ description: "생성일" })
  createdAt: Date;
  @ApiProperty({ description: "수정일" })
  updatedAt: Date;

  converDtoToExcelRecord() {
    return {
      아이디: this.loginId,
      이름: this.name,
      이메일: this.email,
      연락처: this.phone,
      소속학과: this.department.name,
    };
  }
}

export class ProfessorListDto {
  @ApiProperty({ description: "교수 리스트", type: [ProfessorDto] })
  professors: ProfessorDto[];

  constructor(professors: ProfessorDto[]) {
    this.professors = professors;
  }
}
