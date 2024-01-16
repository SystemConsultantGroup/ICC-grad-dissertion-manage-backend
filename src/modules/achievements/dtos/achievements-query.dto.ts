import { Performance } from "@prisma/client";
import { PageQuery } from "../../../common/dtos/pagination.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AchievementsSearchQuery extends PageQuery {
  @ApiProperty({ description: "학번", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  studentNumber?: string;

  @ApiProperty({ description: "이름", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  author?: string;

  @ApiProperty({ description: "전공", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  major?: string;

  @ApiProperty({ description: "논문제목", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  paperTitle?: string;

  @ApiProperty({ description: "실적 구분", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Performance)
  performance?: Performance;

  @ApiProperty({ description: "학술지명", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  journalName?: string;

  @ApiProperty({ description: "게재년월일", required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsDate()
  publicationDate?: Date;
}
