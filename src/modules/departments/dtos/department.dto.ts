import { ApiProperty } from "@nestjs/swagger";
import { Department } from "@prisma/client";

export class DepartmentDto {
  constructor(departmentData: Partial<Department>) {
    this.id = departmentData.id;
    this.name = departmentData.name;
  }

  @ApiProperty({ description: "학과 아이디" })
  id: number;
  @ApiProperty({ description: "학과 이름" })
  name: string;
}
