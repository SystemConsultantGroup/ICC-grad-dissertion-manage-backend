import { ApiProperty } from "@nestjs/swagger";
import { Department } from "@prisma/client";

export class DepartmentDto {
  constructor(departmentData: Partial<Department>) {
    this.id = departmentData.id;
    this.name = departmentData.name;
    this.modificationFlag = departmentData.modificationFlag;
  }

  @ApiProperty({ description: "학과 아이디" })
  id: number;
  @ApiProperty({ description: "학과 이름" })
  name: string;
  @ApiProperty({ description: "수정지시사항 해당 학과 여부" })
  modificationFlag: boolean;
}
