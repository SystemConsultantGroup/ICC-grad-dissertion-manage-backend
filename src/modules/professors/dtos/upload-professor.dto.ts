import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class UploadProfessorDto {
  constructor(excelRecord) {
    this.loginId = excelRecord["아이디"];
    this.name = excelRecord["이름"];
    this.password = excelRecord["비밀번호"] ? excelRecord["비밀번호"].toString() : undefined;
    this.email = excelRecord["이메일"];
    this.phone = excelRecord["연락처"];
    this.departmentName = excelRecord["소속학과"];
  }

  @ApiProperty({ description: "아이디" })
  @Type(() => String)
  loginId: string;

  @ApiProperty({ description: "이름" })
  @Type(() => String)
  name: string;

  @ApiProperty({ description: "비밀번호" })
  @Type(() => String)
  password: string;

  @ApiProperty({ description: "이메일" })
  @Type(() => String)
  email: string;

  @ApiProperty({ description: "연락처" })
  @Type(() => String)
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "소속학과" })
  @Type(() => String)
  departmentName: string;

  @ApiProperty({ description: "소속학과ID" })
  @Type(() => Number)
  @IsOptional()
  deptId?: number;
}
