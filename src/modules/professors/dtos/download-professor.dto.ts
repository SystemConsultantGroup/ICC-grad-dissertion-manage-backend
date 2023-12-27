import { ApiProperty } from "@nestjs/swagger";
import { Department, User } from "@prisma/client";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class DownloadProfessorDto {
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
    this.departmentName = professor.department.name;
  }

  @ApiProperty({ description: "아이디" })
  @Type(() => Number)
  id?: number;

  @ApiProperty({ description: "로그인 아이디" })
  @Type(() => String)
  loginId?: string;

  @ApiProperty({ description: "이름" })
  @Type(() => String)
  name?: string;

  @ApiProperty({ description: "이메일" })
  @Type(() => String)
  email?: string;

  @ApiProperty({ description: "전화번호" })
  @Type(() => String)
  phone?: string;

  @ApiProperty({ description: "학과 이름" })
  @Type(() => String)
  departmentName?: string;
}
