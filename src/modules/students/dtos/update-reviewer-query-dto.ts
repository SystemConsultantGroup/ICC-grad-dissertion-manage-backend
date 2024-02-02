import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum ReviewerRoleQuery {
  ADVISOR = "advisor",
  COMMITTEE_MEMBER = "committee",
}

export class UpdateReviewerQueryDto {
  @ApiProperty({ description: "업데이트할 교수의 역할 선택", enum: ReviewerRoleQuery })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ReviewerRoleQuery)
  role: ReviewerRoleQuery;
}
