import { ApiProperty } from "@nestjs/swagger";
import { Stage } from "@prisma/client";
import { IsDate, IsEnum, IsOptional, IsPositive, IsString } from "class-validator";
import { PageQuery } from "src/common/dtos/pagination.dto";

export enum SearchStatus {
  PENDING = "PENDING",
  COMPLETE = "COMPLETE",
}

export class SearchReviewReqDto extends PageQuery {
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

  @ApiProperty({ description: "심사 결과", required: false })
  @IsOptional()
  @IsEnum(SearchStatus)
  status: SearchStatus;

  @ApiProperty({ description: "시작일", required: false })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiProperty({ description: "종료일", required: false })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
