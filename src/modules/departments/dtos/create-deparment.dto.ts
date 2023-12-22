import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateDepartmentDto {
  @ApiProperty({
    description: "Name of the department",
    example: "소프트웨어학과",
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  name: string;
}  