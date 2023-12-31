import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "src/modules/users/dtos/user.dto";

export class ReviewersDto {
  constructor(headReviewerDto: UserDto, reviewersDto: UserDto[]) {
    this.headReviewer = new UserDto(headReviewerDto);
    this.reviewers = reviewersDto.map((reviewer) => {
      return new UserDto(reviewer);
    });
  }
  @ApiProperty({ description: "심사위원장" })
  headReviewer: UserDto;

  @ApiProperty({ description: "심사위원장 포함 모든 지도교수/심사위원 리스트", type: [UserDto] })
  reviewers: UserDto[];
}
