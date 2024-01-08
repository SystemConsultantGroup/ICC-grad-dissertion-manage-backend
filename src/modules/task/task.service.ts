import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { Phase } from "@prisma/client";

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly scheduleRegistry: SchedulerRegistry
  ) {}

  /**
   * cron 표현식을 반환하는 메소드입니다.
   * @param date : 날짜
   * @returns : `${seconds} ${minute} ${hour} ${day} ${month} *`
   */
  getCronExpression(date: Date) {
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    return `${seconds} ${minute} ${hour} ${day} ${month} *`;
  }

  async getCronjobs() {
    console.log(this.scheduleRegistry.getCronJobs());
  }

  async addCronJob(name: string, time: Date, callback: () => Promise<void>) {
    const job = new CronJob(
      this.getCronExpression(time),
      async () => {
        await callback();
      },
      undefined,
      false,
      "Asia/Seoul"
    );

    this.scheduleRegistry.addCronJob(name, job);
    await job.start();
  }
  /*
   * DB 에 존재하는 모든 시스템 단계를 조회하여 각각의 cron 작업을 등록합니다.
   *
   * 서버가 시작될 때 자동으로 실행됩니다.
   */
  async setCronJobs() {
    // 시스템 락은 일단 구현 보류해놓았습니다.
    // await this.addCronJob("1학기 시스템 락 해제", new Date("2023-02-28"), this.unlock);
    // await this.addCronJob("2학기 시스템 락 해제", new Date("2023-08-31"), this.unlock);

    const phases = await this.prismaService.phase.findMany();

    phases.map(async (phase) => {
      await this.createCronJob(phase);
    });

    await this.getCronjobs();
  }

  async createCronJob(phase: Phase) {
    switch (phase.id) {
      // 1 - [신청서 제출 단계] (해줄게 없음)
      case 1:
        break;
      // 2
    }
  }
}
