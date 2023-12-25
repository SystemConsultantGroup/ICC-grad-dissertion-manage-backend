import { ApiProperty } from "@nestjs/swagger";
import { Phase } from "@prisma/client";

export class PhaseDto {
  @ApiProperty({ description: "단계 ID", example: 1 })
  id: number;

  @ApiProperty({ description: "단계 이름", example: "예심" })
  title: string;

  @ApiProperty({ description: "시작일", example: "2024-01-01" })
  start: Date;

  @ApiProperty({ description: "종료일", example: "2024-01-31" })
  end: Date;

  constructor(phase: Phase) {
    this.id = phase.id;
    this.start = phase.start;
    this.end = phase.end;
  }
}

export class PhasesListDto {
  @ApiProperty({ description: "시스템 단계 리스트" })
  phases: PhaseDto[];

  constructor(phases: PhaseDto[]) {
    this.phases = phases;
  }
}
