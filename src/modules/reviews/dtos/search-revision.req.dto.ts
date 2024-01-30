import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsPositive } from "class-validator";
import { PageQuery } from "src/common/dtos/pagination.dto";

export class SearchRevisionReqDto extends PageQuery {
  @ApiProperty({ description: "저자명", required: false })
  @IsOptional()
  @IsString()
  author: string;

  @ApiProperty({ description: "학과", required: false })
  @IsOptional()
  @IsPositive()
  department: number;

  @ApiProperty({ description: "논문 제목", required: false })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({ description: "심사 현황", required: false, enum: ["PASS", "UNEXAMINED"] })
  @IsOptional()
  @IsEnum(Status)
  contentStatus: Status;
}
