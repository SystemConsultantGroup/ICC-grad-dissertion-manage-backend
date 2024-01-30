import { Reviewer, Role } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class ReviewerDto {
  constructor(reviewer: Reviewer) {
    this.id = reviewer.id;
    this.reviewerId = reviewer.reviewerId;
    this.processId = reviewer.processId;
    this.role = reviewer.role;
  }

  @ApiProperty({ description: "지도관계 아이디" })
  id: number;
  @ApiProperty({ description: "교수 아이디" })
  reviewerId: number;
  @ApiProperty({ description: "논문과정 아이디" })
  processId: number;
  @ApiProperty({ description: "지도 역할" })
  role: Role;
}
