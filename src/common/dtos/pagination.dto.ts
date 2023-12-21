import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class PageDto<T> {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  content: T[];

  constructor(
    pageNumber: number,
    pageSize: number,
    totalCount: number,
    content: T[],
  ) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.totalCount = totalCount;
    this.totalPages = Math.ceil(totalCount / pageSize);
    this.content = content;
  }
}

export class PageQuery {
  @ApiProperty({ description: '페이지 번호' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageNumber: number;

  @ApiProperty({ description: '페이지 크기' })
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
