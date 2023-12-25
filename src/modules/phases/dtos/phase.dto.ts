import { ApiProperty } from "@nestjs/swagger";
import { Phase } from "@prisma/client";

export class PhaseDto {
  constructor(phaseData: Phase) {
    this.id = phaseData.id;
    this.title = phaseData.title;
    this.start = phaseData.start;
    this.end = phaseData.end;
    this.createdAt = phaseData.createdAt;
    this.updatedAt = phaseData.updatedAt;
  }

  @ApiProperty({ description: "시스템 단계 아이디" })
  id: number;
  @ApiProperty({ description: "시스템 단계 이름" })
  title: string;
  @ApiProperty({ description: "시스템 단계 시작일" })
  start: Date;
  @ApiProperty({ description: "시스템 단계 종료일" })
  end: Date;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
