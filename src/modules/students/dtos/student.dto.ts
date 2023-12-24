import { ApiProperty } from "@nestjs/swagger";
import { Department, Phase, Process, User } from "@prisma/client";
import { DepartmentDto } from "src/modules/departments/dtos/department.dto";
import { PhaseDto } from "src/modules/phases/dtos/phase.dto";

export class StudentDto {
  constructor(
    studentData: User & {
      department: Department;
      studentProcess: Process & { phase: Phase };
    }
  ) {
    this.id = studentData.id;
    this.loginId = studentData.loginId;
    this.password = studentData.password;
    this.name = studentData.name;
    this.email = studentData.email;
    this.phone = studentData.phone;
    this.department = studentData.department;
    this.phase = studentData.studentProcess.phase;
    this.createdAt = studentData.createdAt;
    this.updatedAt = studentData.updatedAt;
  }

  @ApiProperty({ description: "아이디" })
  id: number;
  @ApiProperty({ description: "로그인 아이디(학번)" })
  loginId: string;
  @ApiProperty({ description: "비밀번호" })
  password: string;
  @ApiProperty({ description: "이름" })
  name: string;
  @ApiProperty({ description: "이메일" })
  email: string;
  @ApiProperty({ description: "연락처" })
  phone: string;
  @ApiProperty({ description: "학과", type: () => DepartmentDto })
  department: DepartmentDto;
  @ApiProperty({ description: "시스템 단계", type: () => PhaseDto })
  phase: PhaseDto;
  @ApiProperty({ description: "생성일" })
  createdAt: Date;
  @ApiProperty({ description: "수정일" })
  updatedAt: Date;
}
