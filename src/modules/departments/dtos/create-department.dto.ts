import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateDepartmentDto {
  @ApiProperty({
    description: "학과 이름",
    example: "소프트웨어학과",
  })
  @IsNotEmpty({ message: "학과 이름을 입력해주세요." })
  @IsString()
  @Type(() => String)
  name: string;
}
