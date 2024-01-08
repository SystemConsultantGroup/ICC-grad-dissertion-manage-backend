import { ApiProperty } from "@nestjs/swagger";
import { Stage, Summary } from "@prisma/client";
import { ThesisInfoDto } from "./thesis-info.dto";

export class GetResultListResDto {
  constructor(thesisInfo: ThesisInfoDto) {
    this.id = thesisInfo.id;
    this.student = thesisInfo.process.student.name;
    this.department = thesisInfo.process.student.department.name;
    this.stage = thesisInfo.stage;
    this.title = thesisInfo.title;
    this.summary = thesisInfo.summary;
  }

  @ApiProperty({ description: "논문심사 아이디" })
  id: number;
  @ApiProperty({ description: "논문 저자 (학생)" })
  student: string;
  @ApiProperty({ description: "학과명" })
  department: string;
  @ApiProperty({ description: "심사단계 (구분)", enum: Stage })
  stage: Stage;
  @ApiProperty({ description: "논문 제목" })
  title: string;
  @ApiProperty({ description: "최종 합격 여부", enum: Summary })
  summary: Summary;
}
