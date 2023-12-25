import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { getKST } from "../../common/utils/date.util";

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
}
