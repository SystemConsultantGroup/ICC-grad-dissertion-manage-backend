import { ApiProperty } from "@nestjs/swagger";
import { Phase } from "@prisma/client";
import { PhaseDto } from "src/modules/phases/dtos/phase.dto";

export class SystemDto {
  constructor(systemData: { phase: Phase; isLock: boolean }) {
    this.phase = systemData.phase;
    this.isLock = systemData.isLock;
  }

  @ApiProperty({ description: "학생의 현재 시스템 단계", type: () => PhaseDto })
  phase: Phase;

  @ApiProperty({ description: "학생의 시스템 락 여부" })
  isLock: boolean;
}
