import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";
import { Performance } from "../../../common/enums/performance.enum";
import { Author } from "../../../common/enums/author.enum";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class UpdateAchievementsDto {
  @ApiProperty({
    description: "논문 실적 구분",
    example: "SCI",
    required: false,
  })
  @IsOptional()
  @IsEnum(Performance)
  performance?: Performance;

  @ApiProperty({
    description: "논문 제목",
    example: "Design of Real-Time SIFT Feature Extraction",
    required: false,
  })
  @IsOptional()
  @IsString()
  paperTitle?: string;

  @ApiProperty({
    description: "학술지명/학술대회명",
    example: "ACM",
    required: false,
  })
  @IsOptional()
  @IsString()
  journalName?: string;

  @ApiProperty({
    description: "ISSN",
    example: "1234-1234",
    required: false,
  })
  @IsOptional()
  @IsString()
  ISSN?: string;

  @ApiProperty({
    description: "게재년월",
    example: "2023-01-13",
    required: false,
  })
  @IsOptional()
  @IsDate()
  publicationDate?: Date;

  @ApiProperty({
    description: "주저자여부",
    example: "FIRST_AUTHOR",
    required: false,
  })
  @IsOptional()
  @IsEnum(Author)
  authorType?: Author;

  @ApiProperty({
    description: "저자수",
    example: " 2",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  authorNumbers?: number;
}
