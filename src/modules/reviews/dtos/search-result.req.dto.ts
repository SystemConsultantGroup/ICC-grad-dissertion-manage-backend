import { ApiProperty } from "@nestjs/swagger";
import { Stage, Summary } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PageQuery } from "src/common/dtos/pagination.dto";

export class SearchResultReqDto extends PageQuery {
  @ApiProperty({ description: "저자명", required: false })
  @IsOptional()
  @IsString()
  author: string;

  @ApiProperty({ description: "학과", required: false })
  @IsOptional()
  @IsString()
  department: string;

  @ApiProperty({ description: "구분", required: false })
  @IsOptional()
  @IsEnum(Stage)
  stage: Stage;

  @ApiProperty({ description: "논문 제목", required: false })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({ description: "최종 합격 여부", required: false })
  @IsOptional()
  @IsEnum(Summary)
  summary: Summary;
}
