import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { ReviewDto } from "./review.dto";
import { ThesisFileDto } from "./thesis-file.dto";

export class GetRevisionResDto {
  constructor(review: ReviewDto) {
    this.id = review.id;
    this.title = review.thesisInfo.title;
    this.student = review.thesisInfo.process.student.name;
    this.department = review.thesisInfo.process.student.department.name;
    this.abstract = review.thesisInfo.abstract;
    this.thesisFiles = review.thesisInfo.thesisFiles;
    this.contentStatus = review.contentStatus;
  }

  @ApiProperty({ description: "논문심사 아이디" })
  id: number;
  @ApiProperty({ description: "논문 제목" })
  title: string;
  @ApiProperty({ description: "논문 저자 (학생)" })
  student: string;
  @ApiProperty({ description: "학과/전공" })
  department: string;
  @ApiProperty({ description: "논문 초록" })
  abstract: string;
  @ApiProperty({ description: "논문 파일", type: [ThesisFileDto] })
  thesisFiles: ThesisFileDto[];
  @ApiProperty({ description: "내용 합격 여부", enum: Status })
  contentStatus: Status;
}
