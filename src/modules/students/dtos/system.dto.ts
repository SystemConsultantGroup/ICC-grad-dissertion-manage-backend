import { ApiProperty } from "@nestjs/swagger";
import { Phase } from "@prisma/client";
import { PhaseDto } from "src/modules/phases/dtos/phase.dto";

export class SystemDto {
  constructor(systemData: { phase: Phase }) {
    this.phase = new PhaseDto(systemData.phase);
  }

  @ApiProperty({ description: "학생의 현재 시스템 단계", type: () => PhaseDto })
  phase: Phase;
}
