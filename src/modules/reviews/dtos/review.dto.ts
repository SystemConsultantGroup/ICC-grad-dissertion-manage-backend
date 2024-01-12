import { ApiProperty } from "@nestjs/swagger";
import { Review, ThesisInfo, User, File, Status, Process, Department, ThesisFile } from "@prisma/client";
import { ThesisInfoDto } from "./thesis-info.dto";

export class ReviewDto {
  constructor(
    review: Review & {
      thesisInfo: ThesisInfo & {
        process: Process & { student: User & { department: Department } };
        thesisFiles: (ThesisFile & { file: File })[];
      };
      reviewer: User;
      file: File;
    }
  ) {
    this.id = review.id;
    this.thesisInfo = review.thesisInfo;
    this.reviewer = review.reviewer;
    this.file = review.file;
    this.status = review.status;
    this.comment = review.comment;
    this.isFinal = review.isFinal;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;
  }

  @ApiProperty({ description: "논문심사 아이디" })
  id: number;
  @ApiProperty({ description: "논문정보", type: () => ThesisInfoDto })
  thesisInfo?: ThesisInfoDto;
  @ApiProperty({ description: "심사위원" })
  reviewer: User;
  @ApiProperty({ description: "심사정보 파일" })
  file?: File;
  @ApiProperty({ description: "심사 상태", enum: Status })
  status: Status;
  @ApiProperty({ description: "심사 의견" })
  comment: string;
  @ApiProperty({ description: "최종 심사 여부" })
  isFinal: boolean;
  @ApiProperty({ description: "createdAt" })
  createdAt: Date;
  @ApiProperty({ description: "updatedAt" })
  updatedAt: Date;
}
