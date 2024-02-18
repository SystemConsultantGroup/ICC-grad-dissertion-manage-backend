import { ApiProperty } from "@nestjs/swagger";
import {
  Process,
  ThesisInfo,
  Stage,
  Summary,
  User,
  Department,
  ThesisFile,
  File,
  Reviewer,
  Review,
} from "@prisma/client";
import { ProcessDto } from "./process.dto";
import { ReviewDto } from "./review.dto";
import { ThesisFileDto } from "./thesis-file.dto";

export class ThesisInfoDto {
  constructor(
    thesisInfo: ThesisInfo & {
      process: Process & { student: User & { department: Department }; reviewers: Reviewer[] };
      thesisFiles: (ThesisFile & { file: File })[];
      reviews?: (Review & { reviewer?: User & { department: Department }; file?: File })[];
    }
  ) {
    if (!thesisInfo) return;
    this.id = thesisInfo.id;
    this.process = thesisInfo.process;
    this.title = thesisInfo.title;
    this.abstract = thesisInfo.abstract;
    this.stage = thesisInfo.stage;
    this.summary = thesisInfo.summary;
    this.thesisFiles = thesisInfo.thesisFiles;
    if (thesisInfo.reviews) this.reviews = thesisInfo.reviews.map((review) => new ReviewDto(review));
  }

  @ApiProperty({ description: "논문정보 아이디" })
  id: number;
  @ApiProperty({ description: "논문과정", type: () => ProcessDto })
  process: ProcessDto;
  @ApiProperty({ description: "논문 제목" })
  title: string;
  @ApiProperty({ description: "논문 초록" })
  abstract: string;
  @ApiProperty({ description: "심사 단계", enum: Stage })
  stage: Stage;
  @ApiProperty({ description: "최종 합격 여부", enum: Summary })
  summary: Summary;
  @ApiProperty({ description: "논문 파일", type: () => [ThesisFileDto] })
  thesisFiles: ThesisFileDto[];
  @ApiProperty({ description: "심사 정보", type: () => [ReviewDto] })
  reviews?: ReviewDto[];
}
