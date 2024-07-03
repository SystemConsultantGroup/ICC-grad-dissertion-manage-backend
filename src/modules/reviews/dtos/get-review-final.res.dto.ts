import { ApiProperty } from "@nestjs/swagger";
import { Stage, Status } from "@prisma/client";
import { FileDto } from "src/modules/files/dtos/file.dto";
import { ReviewDto } from "./review.dto";
import { ThesisFileDto } from "./thesis-file.dto";

export class GetReviewFinalResDto {
  constructor(review: ReviewDto) {
    this.id = review.id;
    this.student = review.thesisInfo.process.student.name;
    this.department = review.thesisInfo.process.student.department.name;
    this.title = review.thesisInfo.title;
    this.abstract = review.thesisInfo.abstract;
    this.thesisFiles = review.thesisInfo.thesisFiles;
    this.status = review.contentStatus;
    this.comment = review.comment;
    this.reviewFile = review.file;
    this.stage = review.thesisInfo.stage;
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
  reviewFile: FileDto;
  @ApiProperty({ description: "논문 단계", enum: Stage })
  stage: Stage;
}
