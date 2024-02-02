import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { UTC2KST, getKST } from "../../common/utils/date.util";
import { UpdatePhaseDto } from "./dtos/update-phase.dto";
import { TaskService } from "../task/task.service";

@Injectable()
export class PhasesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly taskSerivce: TaskService
  ) {}

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

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const updatedPhase = await tx.phase.update({
          where: {
            id,
          },
          data: {
            start: UTC2KST(updatePhaseDto.start),
            end: UTC2KST(updatePhaseDto.end),
          },
        });

        await this.taskSerivce.resetCronJob(updatedPhase);
      });
    } catch (error) {
      throw new BadRequestException("invalid request");
    }
  }
}
