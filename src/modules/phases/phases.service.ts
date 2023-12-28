import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { UTC2KST, getKST } from "../../common/utils/date.util";
import { UpdatePhaseDto } from "./dtos/update-phase.dto";

@Injectable()
export class PhasesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPhaseList() {
    const phaseList = await this.prismaService.phase.findMany({
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
      },
    });

    return phaseList;
  }

  async getCurrentPhases() {
    const currentDate = getKST();
    const phase = await this.prismaService.phase.findMany({
      where: {
        start: {
          lte: currentDate,
        },
        end: {
          gte: currentDate,
        },
      },
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
      },
    });

    return phase;
  }

  async updatePhase(id: number, updatePhaseDto: UpdatePhaseDto) {
    const phase = this.prismaService.phase.findUnique({
      where: {
        id,
      },
    });

    if (!phase) {
      throw new BadRequestException("존재하지 않는 시스템 단계입니다.");
    }

    if (updatePhaseDto.end <= updatePhaseDto.start) {
      throw new BadRequestException("기간이 잘못 설정되었습니다.");
    }

    // const endDateTime = new Date(updatePhaseDto.end);
    const endDateTime = UTC2KST(updatePhaseDto.end);
    endDateTime.setUTCHours(23, 59, 59, 0);
    try {
      return await this.prismaService.$transaction(async (tx) => {
        await tx.phase.update({
          where: {
            id,
          },
          data: {
            start: updatePhaseDto.start,
            end: endDateTime.toISOString(),
          },
        });

        // 행정실 문의 확인후 cron task 추가 필요
      });
    } catch (error) {
      throw new BadRequestException("invalid request");
    }
  }
}
