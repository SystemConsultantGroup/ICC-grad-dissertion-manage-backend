import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "src/modules/users/dtos/user.dto";

export class ReviewersDto {
  constructor(headReviewerDto: UserDto, advisorsDto: UserDto[], committeesDto: UserDto[]) {
    this.headReviewer = new UserDto(headReviewerDto);
    this.advisors = advisorsDto.map((advisor) => new UserDto(advisor));
    this.committees = committeesDto.map((committee) => new UserDto(committee));
  }
  @ApiProperty({ description: "심사위원장" })
  headReviewer: UserDto;

  @ApiProperty({ description: "지도 교수 리스트(1~2명)", type: [UserDto] })
  advisors: UserDto[];

  @ApiProperty({ description: "심사위원 리스트(1~2명)", type: [UserDto] })
  committees: UserDto[];
}
