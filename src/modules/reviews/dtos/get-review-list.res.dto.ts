import { ApiProperty } from "@nestjs/swagger";
import { Status, Stage } from "@prisma/client";
import { ReviewDto } from "./review.dto";

export class GetReviewListResDto {
  constructor(review: ReviewDto) {
    this.id = review.id;
    this.student = review.thesisInfo.process.student.name;
    this.department = review.thesisInfo.process.student.department.name;
    this.stage = review.thesisInfo.stage;
    this.title = review.thesisInfo.title;
    this.status = review.status;
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
  @ApiProperty({ description: "심사 현황", enum: Status })
  status: Status;
}
