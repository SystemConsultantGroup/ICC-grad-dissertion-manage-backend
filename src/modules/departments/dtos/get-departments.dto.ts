import { ApiProperty } from "@nestjs/swagger";

class DepartmentInfoDto {
  @ApiProperty({
    description: "ID of the department",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Name of the department",
    example: "소프트웨어학과",
  })
  name: string;
  @ApiProperty({
    description: "Number of users in the department",
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
