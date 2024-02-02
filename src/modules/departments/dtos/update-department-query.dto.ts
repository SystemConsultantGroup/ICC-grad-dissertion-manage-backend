import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateDepartmentQuery {
  @ApiProperty({ description: "학과를 제외할 경우(true) / 제외를 취소할경우(false)", example: true, required: true })
  @IsNotEmpty()
  @IsString()
  exclude: string;
}
