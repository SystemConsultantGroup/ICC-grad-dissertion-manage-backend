import { ApiProperty } from "@nestjs/swagger";

class DepartmentDto {
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
}

export class GetDepartmentsResponseDto {
  @ApiProperty({
    description: "List of departments",
    type: [DepartmentDto],
  })
  departments: DepartmentDto[];

  constructor(departments: DepartmentDto[]) {
    this.departments = departments;
  }
}
