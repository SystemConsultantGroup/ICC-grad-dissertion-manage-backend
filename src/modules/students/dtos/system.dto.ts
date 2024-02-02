import { ApiProperty } from "@nestjs/swagger";
import { Phase, Process, Stage } from "@prisma/client";
import { PhaseDto } from "src/modules/phases/dtos/phase.dto";

export class SystemDto {
  constructor(systemData: Process & { phase: Phase }) {
    this.phase = new PhaseDto(systemData.phase);
    this.currentPhase = systemData.currentPhase;
  }

  @ApiProperty({ description: "학생의 현재 시스템 단계 상세 정보", type: () => PhaseDto })
  phase: Phase;

  @ApiProperty({ description: "현재 단계", enum: Stage })
  currentPhase: Stage;
}
