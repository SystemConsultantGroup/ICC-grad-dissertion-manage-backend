import { ApiProperty } from "@nestjs/swagger";
import { Department, User, UserType } from "@prisma/client";
import { DepartmentDto } from "src/modules/departments/dtos/department.dto";

export class PhDDto {
  constructor(phdData: Partial<User> & { department: Department }) {
    this.id = phdData.id;
    this.loginId = phdData.loginId;
    this.name = phdData.name;
    this.email = phdData.email;
    this.phone = phdData.phone;
    this.type = phdData.type;
    this.department = phdData.department ? new DepartmentDto(phdData.department) : undefined;
  }

  @ApiProperty({ description: "아이디" })
  id: number;
  @ApiProperty({ description: "로그인 아이디" })
  loginId: string;
  @ApiProperty({ description: "이름" })
  name: string;
  @ApiProperty({ description: "이메일" })
  email?: string;
  @ApiProperty({ description: "연락처" })
  phone?: string;
  @ApiProperty({ description: "사용자 유형", enum: UserType, example: UserType.PHD })
  type: UserType;
  @ApiProperty({ description: "학과" })
  department: DepartmentDto;
}
