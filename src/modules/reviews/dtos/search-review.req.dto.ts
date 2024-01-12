import { ApiProperty } from "@nestjs/swagger";
import { Stage, Status } from "@prisma/client";
import { IsEnum, IsOptional, IsPositive, IsString } from "class-validator";
import { PageQuery } from "src/common/dtos/pagination.dto";

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

  @ApiProperty({ description: "심사 결과", required: false, enum: ["PASS", "FAIL", "PENDING", "UNEXAMINED"] })
  @IsOptional()
  @IsEnum(Status)
  status: Status;
}
