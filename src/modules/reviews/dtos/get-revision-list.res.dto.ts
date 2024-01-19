import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { ReviewDto } from "./review.dto";

export class GetRevisionListResDto {
  constructor(review: ReviewDto) {
    this.id = review.id;
    this.student = review.thesisInfo.process.student.name;
    this.department = review.thesisInfo.process.student.department.name;
    this.title = review.thesisInfo.title;
    this.status = review.contentStatus;
  }

  @ApiProperty({ description: "논문심사 아이디" })
  id: number;
  @ApiProperty({ description: "논문 저자 (학생)" })
  student: string;
  @ApiProperty({ description: "학과명" })
  department: string;
  @ApiProperty({ description: "논문 제목" })
  title: string;
  @ApiProperty({ description: "확인 여부", enum: Status })
  status: Status;
}
