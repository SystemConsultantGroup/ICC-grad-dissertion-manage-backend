import { ApiProperty } from "@nestjs/swagger";
import { Stage } from "@prisma/client";
import { ReviewDto } from "./review.dto";
import { ReviewerDto } from "./reviewer.dto";
import { ThesisInfoDto } from "./thesis-info.dto";

export class GetCurrentListResDto {
  constructor(thesisInfo: ThesisInfoDto) {
    this.id = thesisInfo.id;
    this.student = thesisInfo.process.student.name;
    this.department = thesisInfo.process.student.department.name;
    this.stage = thesisInfo.stage;
    this.title = thesisInfo.title;
    this.reviews = thesisInfo.reviews;
    this.reviewers = thesisInfo.process.reviewers;
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
  @ApiProperty({ description: "심사 현황", type: [ReviewDto] })
  reviews: ReviewDto[];
  @ApiProperty({ description: "심사자 지도관계", type: [ReviewerDto] })
  reviewers: ReviewerDto[];
}
