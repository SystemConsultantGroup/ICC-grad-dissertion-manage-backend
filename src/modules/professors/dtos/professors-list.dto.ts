import { ApiProperty } from "@nestjs/swagger";
import { ProfessorDto } from "./professor.dto";

export class ProfessorListDto {
  @ApiProperty({ description: "교수 리스트", type: [ProfessorDto] })
  professors: ProfessorDto[];

  constructor(professors: ProfessorDto[]) {
    this.professors = professors;
  }
}
