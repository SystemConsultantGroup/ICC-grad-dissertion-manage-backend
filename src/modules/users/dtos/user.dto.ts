import { ApiProperty } from "@nestjs/swagger";
import { Department, File, Process, Stage, User, UserType } from "@prisma/client";
import { DepartmentDto } from "src/modules/departments/dtos/department.dto";
import { FileDto } from "src/modules/files/dtos/file.dto";

export class UserDto {
  constructor(
    studentData: Partial<User> & {
      department: Partial<Department>;
      studentProcess?: Partial<Process>;
      signFile?: File;
    }
  ) {
    this.id = studentData.id;
    this.loginId = studentData.loginId;
    this.name = studentData.name;
    this.email = studentData.email;
    this.phone = studentData.phone;
    this.type = studentData.type;
    this.department = studentData.department ? new DepartmentDto(studentData.department) : undefined;
    this.stage = studentData.studentProcess?.currentPhase;
    this.signFile = studentData.signFile ? new FileDto(studentData.signFile) : undefined;
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
  @ApiProperty({ description: "사용자 유형", enum: UserType })
  type: UserType;
  @ApiProperty({ description: "학과" })
  department: DepartmentDto;
  @ApiProperty({ description: "시스템 단계", enum: Stage })
  stage?: Stage;
  @ApiProperty({ description: "교수 서명 파일" })
  signFile?: FileDto;
}
