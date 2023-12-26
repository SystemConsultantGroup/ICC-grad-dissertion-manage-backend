import { ApiProperty } from "@nestjs/swagger";
import { Department, User } from "@prisma/client";
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
  id: number;

  @ApiProperty({ description: "로그인 아이디" })
  loginId: string;
  @ApiProperty({ description: "이름" })
  name: string;
  @ApiProperty({ description: "이메일" })
  email: string;
  @ApiProperty({ description: "연락처" })
  phone: string;
  @ApiProperty({ description: "학과", type: () => DepartmentDto })
  department: DepartmentDto;
  @ApiProperty({ description: "생성일" })
  createdAt: Date;
  @ApiProperty({ description: "수정일" })
  updatedAt: Date;
}
