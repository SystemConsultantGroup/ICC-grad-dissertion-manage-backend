import { ApiProperty } from "@nestjs/swagger";

class DepartmentInfo {
  @ApiProperty({
    description: "학과 ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "학과 이름",
    example: "소프트웨어학과",
  })
  name: string;
  @ApiProperty({
    description: "학과 사용자 수",
    example: 1,
  })
  userCount: number;
}

export class GetDepartmentsDto {
  @ApiProperty({
    description: "학과 정보 리스트",
    type: [DepartmentInfo],
  })
  departments: DepartmentInfo[];

  constructor(departments: DepartmentInfo[]) {
    this.departments = departments;
  }
}
