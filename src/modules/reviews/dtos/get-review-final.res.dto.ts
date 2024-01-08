import { ApiProperty } from "@nestjs/swagger";
import { File, Status } from "@prisma/client";
import { ReviewDto } from "./review.dto";
import { ThesisFileDto } from "./thesis-file.dto";

export class GetReviewFinalResDto {
  constructor(review: ReviewDto) {
    this.id = review.id;
    this.student = review.thesisInfo.process.student.name;
    this.department = review.thesisInfo.process.student.department.name;
    this.abstract = review.thesisInfo.abstract;
    this.thesisFiles = review.thesisInfo.thesisFiles;
    this.status = review.status;
    this.comment = review.comment;
    this.reviewFile = review.file;
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
  @ApiProperty({ description: "합격 여부", enum: Status })
  status: Status;
  @ApiProperty({ description: "심사 의견" })
  comment: string;
  @ApiProperty({ description: "심사 의견 파일" })
  reviewFile: File;
}
