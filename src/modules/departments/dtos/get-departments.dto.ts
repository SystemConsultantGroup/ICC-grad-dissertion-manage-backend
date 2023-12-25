import { ApiProperty } from "@nestjs/swagger";

class DepartmentInfoDto {
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

export class GetDepartmentsResponseDto {
  @ApiProperty({
    description: "List of departments",
    type: [DepartmentInfoDto],
  })
  departments: DepartmentInfoDto[];

  constructor(departments: DepartmentInfoDto[]) {
    this.departments = departments;
  }
}
