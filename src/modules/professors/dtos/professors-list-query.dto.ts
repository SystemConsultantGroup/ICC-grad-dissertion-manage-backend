import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";
import { PageQuery } from "src/common/dtos/pagination.dto";

export class ProfessorListPaginationQuery extends PageQuery {
  // 다중 상속이 안됨....
  @ApiProperty({ description: "아이디", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  loginId?: string;

  @ApiProperty({ description: "이름", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  name?: string;

  @ApiProperty({ description: "이메일", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  email?: string;

  @ApiProperty({ description: "전화번호", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  phone?: string;

  @ApiProperty({ description: "학과 아이디", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  deptId?: number;
}

export class ProfessorListQuery {
  @ApiProperty({ description: "아이디", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  loginId?: string;

  @ApiProperty({ description: "이름", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  name?: string;

  @ApiProperty({ description: "이메일", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  email?: string;

  @ApiProperty({ description: "전화번호", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => String)
  phone?: string;

  @ApiProperty({ description: "학과 아이디", required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  deptId?: number;
}
