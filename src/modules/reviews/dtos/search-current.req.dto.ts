import { ApiProperty } from "@nestjs/swagger";
import { Stage } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsPositive } from "class-validator";
import { PageQuery } from "src/common/dtos/pagination.dto";

export class SearchCurrentReqDto extends PageQuery {
  @ApiProperty({ description: "저자명", required: false })
  @IsOptional()
  @IsString()
  author: string;

  @ApiProperty({ description: "학과", required: false })
  @IsOptional()
  @IsPositive()
  department: number;

  @ApiProperty({ description: "구분", required: false, enum: ["PRELIMINARY", "MAIN"] })
  @IsOptional()
  @IsEnum(Stage)
  stage: Stage;

  @ApiProperty({ description: "논문 제목", required: false })
  @IsOptional()
  @IsString()
  title: string;
}
