import { ApiProperty } from "@nestjs/swagger";
import { Department, Process, Reviewer, User } from "@prisma/client";
import { UserDto } from "src/modules/users/dtos/user.dto";
import { ReviewerDto } from "./reviewer.dto";

export class ProcessDto {
  constructor(
    process: Process & {
      student: User & { department: Department };
      reviewers: Reviewer[];
    }
  ) {
    this.id = process.id;
    this.student = process.student;
    this.reviewers = process.reviewers;
  }

  @ApiProperty({ description: "논문과정 아이디" })
  id: number;
  @ApiProperty({ description: "논문저자", type: () => UserDto })
  student: UserDto;
  @ApiProperty({ description: "지도 관계", type: () => [ReviewerDto] })
  reviewers: ReviewerDto[];
}
