import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail } from "class-validator";
import { IsKoreanPhoneNumber } from "src/common/decorators/is-kr-phone-number.decorator";

export class UploadProfessorDto {
  constructor(excelRecord) {
    this.loginId = excelRecord["로그인아이디"].toString();
    this.name = excelRecord["이름"];
    this.password = excelRecord["비밀번호"] ? excelRecord["비밀번호"].toString() : undefined;
    this.email = excelRecord["이메일"] ? excelRecord["이메일"].toString() : undefined;
    this.phone = excelRecord["연락처"] ? excelRecord["연락처"].toString() : undefined;
    this.departmentName = excelRecord["학과"];
  }

  @ApiProperty({ description: "로그인 아이디" })
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

  @ApiProperty({ description: "학과" })
  @Type(() => String)
  departmentName: string;
}
