import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail } from "class-validator";
import { IsKoreanPhoneNumber } from "src/common/decorators/is-kr-phone-number.decorator";

export class UploadProfessorDto {
  constructor(excelRecord) {
    this.loginId = excelRecord["아이디"];
    this.name = excelRecord["이름"];
    this.password = excelRecord["비밀번호"] ? excelRecord["비밀번호"].toString() : undefined;
    this.email = excelRecord["이메일"];
    this.phone = excelRecord["연락처"].toString();
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
  @IsEmail()
  @Type(() => String)
  email: string;

  @ApiProperty({ description: "연락처" })
  @IsKoreanPhoneNumber()
  @Type(() => String)
  phone: string;

  @ApiProperty({ description: "소속학과" })
  @Type(() => String)
  departmentName: string;
}
