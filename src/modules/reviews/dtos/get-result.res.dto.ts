import { ApiProperty } from "@nestjs/swagger";
import { ReviewDto } from "./review.dto";
import { ThesisFileDto } from "./thesis-file.dto";
import { ThesisInfoDto } from "./thesis-info.dto";

export class GetResultResDto {
  constructor(result: ThesisInfoDto) {
    this.id = result.id;
    this.title = result.title;
    this.student = result.process.student.name;
    this.department = result.process.student.department.name;
    this.abstract = result.abstract;
    this.thesisFiles = result.thesisFiles;
    this.reviews = result.reviews;
  }

  @ApiProperty({ description: "논문정보 아이디" })
  id: number;
  @ApiProperty({ description: "논문 제목" })
  title: string;
  @ApiProperty({ description: "논문 저자 (학생)" })
  student: string;
  @ApiProperty({ description: "학과/전공" })
  department: string;
  @ApiProperty({ description: "논문 초록" })
  abstract: string;
  @ApiProperty({ description: "연관 파일", type: [ThesisFileDto] })
  thesisFiles: ThesisFileDto[];
  @ApiProperty({ description: "심사 결과 목록", type: [ReviewDto] })
  reviews: ReviewDto[];
}
