import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive } from "class-validator";

export class PageDto<T> {
  @ApiProperty({ description: "페이지 번호" })
  pageNumber: number;

  @ApiProperty({ description: "페이지 크기" })
  pageSize: number;

  @ApiProperty({ description: "총 콘텐츠 수" })
  totalCount: number;

  @ApiProperty({ description: "총 페이지 수" })
  totalPages: number;

  content: T[];

  constructor(pageNumber: number, pageSize: number, totalCount: number, content: T[]) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.totalCount = totalCount;
    this.totalPages = Math.ceil(totalCount / pageSize);
    this.content = content;
  }
}

export class PageQuery {
  @ApiProperty({ description: "페이지 번호", example: "2" })
  @IsNotEmpty({ message: "페이지 번호는 비워둘 수 없습니다." })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageNumber: number;

  @ApiProperty({ description: "페이지 크기", example: "5" })
  @IsNotEmpty({ message: "페이지 크기는 비워둘 수 없습니다." })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize: number;

  getOffset(): number {
    return (+this.pageNumber - 1) * +this.pageSize;
  }

  getLimit(): number {
    return +this.pageSize;
  }
}
