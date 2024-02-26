import { ApiProperty } from "@nestjs/swagger";
import {
  Review,
  ThesisInfo,
  User,
  File,
  Status,
  Process,
  Department,
  ThesisFile,
  Reviewer,
  Summary,
} from "@prisma/client";
import { ThesisInfoDto } from "./thesis-info.dto";
import { FileDto } from "src/modules/files/dtos/file.dto";
import { UserDto } from "src/modules/users/dtos/user.dto";
import { GetReviewFinalResDto } from "./get-review-final.res.dto";

export class ReviewDto {
  constructor(
    review: Review & {
      thesisInfo?: ThesisInfo & {
        process: Process & { student: User & { department: Department }; reviewers: Reviewer[] };
        thesisFiles: (ThesisFile & { file: File })[];
      };
      reviewer?: User & { department: Department };
      file?: File;
    }
  ) {
    this.id = review.id;
    this.thesisInfo = new ThesisInfoDto(review.thesisInfo);
    if (review.reviewer) this.reviewer = new UserDto(review.reviewer);
    if (review.file) this.file = new FileDto(review.file);
    this.contentStatus = review.contentStatus;
    this.presentationStatus = review.presentationStatus;
    this.comment = review.comment;
    this.isFinal = review.isFinal;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;
  }

  @ApiProperty({ description: "논문심사 아이디" })
  id: number;
  @ApiProperty({ description: "논문정보", type: () => ThesisInfoDto })
  thesisInfo?: ThesisInfoDto;
  @ApiProperty({ description: "심사위원", type: () => UserDto })
  reviewer?: UserDto;
  @ApiProperty({ description: "심사정보 파일", type: FileDto })
  file?: FileDto;
  @ApiProperty({ description: "내용 심사 상태", enum: Status })
  contentStatus: Status;
  @ApiProperty({ description: "구두 심사 상태", enum: Status })
  presentationStatus: Status;
  @ApiProperty({ description: "심사 의견" })
  comment: string;
  @ApiProperty({ description: "최종 심사 여부" })
  isFinal: boolean;
  @ApiProperty({ description: "createdAt" })
  createdAt: Date;
  @ApiProperty({ description: "updatedAt" })
  updatedAt: Date;
}

type OtherReview = Review & {
  reviewer: { name: string };
  fileId: string;
};

export class OtherReviewDto {
  constructor(otherReview: OtherReview) {
    this.name = otherReview.reviewer.name;
    this.presentationResult = otherReview.presentationStatus;
    this.contentResult = otherReview.contentStatus;
    if (otherReview.fileId) this.fileId = otherReview.fileId;
    else this.fileId = null;
  }

  @ApiProperty({ description: "심사위원 이름" })
  name: string;

  @ApiProperty({ description: "내용 심사결과", enum: Summary })
  presentationResult: Summary;

  @ApiProperty({ description: "구두 심사결과", enum: Summary })
  contentResult: Summary;

  @ApiProperty({ description: "심사 의견 파일" })
  fileId: string;
}
export class FinalReviewDto {
  constructor(review: GetReviewFinalResDto, otherReviews?: OtherReviewDto[]) {
    this.finalReview = review;
    if (otherReviews) this.otherReviews = [...otherReviews];
  }

  @ApiProperty({ description: "심사위원장 심사 정보", type: () => GetReviewFinalResDto })
  finalReview: GetReviewFinalResDto;

  @ApiProperty({ description: "심사위원 심사 정보", required: false, isArray: true })
  otherReviews?: OtherReviewDto[];
}
