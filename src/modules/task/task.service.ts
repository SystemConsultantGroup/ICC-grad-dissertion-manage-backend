import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { Phase, Stage, Status } from "@prisma/client";

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
    const month = date.getUTCMonth() + 1; //getUTCMonth()는 0-11까지 반환
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    return `${seconds} ${minute} ${hour} ${day} ${month} *`;
  }

  async getCronjobs() {
    console.log(this.scheduleRegistry.getCronJobs());
  }

  async resetCronJob(phase: Phase) {
    try {
      await this.scheduleRegistry.deleteCronJob(phase.title);
      await this.createCronJob(phase);
    } catch (e) {
      console.log(`cronJob 업데이트 실패 ${e}`);
    }

    const updatedJob = await this.scheduleRegistry.getCronJob(phase.title);
    console.log(updatedJob);
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

    console.log(`현재 시스템시간: ${new Date()}`);
    // await this.getCronjobs();
  }

  async createCronJob(phase: Phase) {
    switch (phase.id) {
      // 1 - [예심 논문 업로드 단계]
      case 1:
        break;
      // 2 - [예심 논문 심사 단계]
      case 2:
        this.addCronJob(phase.title, phase.start, this._02);
        break;
      // 3 - [예심 논문 최종 심사 단계]
      case 3:
        this.addCronJob(phase.title, phase.start, this._03);
        break;
      // 4 - [본심 논문 업로드 단계]
      case 4:
        break;
      // 5 - [본심 논문 심사 단계]
      case 5:
        this.addCronJob(phase.title, phase.start, this._05);
        break;
      // 6 - [본심 논문 최종 심사 단계]
      case 6:
        this.addCronJob(phase.title, phase.start, this._06);
        break;
      // 7 - [수정 지시 사항 업로드 단계]
      case 7:
        this.addCronJob(phase.title, phase.start, this._07);
        break;
      //8 - [수정 지시 사항 심사 단계]
      case 8:
        this.addCronJob(phase.title, phase.start, this._08);
        break;
      //9 - [논문 실적 제출 단계]
      case 9:
        this.addCronJob(phase.title, phase.start, this._09);
        break;
      case 10:
        this.addCronJob(phase.title, phase.start, this._10);
        break;
      default:
        console.log("WARNING: Cron작업이 제대로 작동이 안되고 있을 가능성이 있습니다. DB에서 단계를 확인해주세요");
        break;
    }
  }

  _02 = async () => {
    console.log("[예심 논문 업로드] 단계인 학생을 [예심 논문 심사] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        where: {
          phaseId: 1,
          thesisInfos: {
            some: {
              stage: { equals: Stage.PRELIMINARY },
              thesisFiles: {
                every: {
                  fileId: { not: null },
                }, //논문을 제출한 학생만 단계 업데이트
              },
            },
          },
        },
        data: {
          phaseId: 2,
        },
      });
    });
  };
  _03 = async () => {
    //단계 업데이트에 추가적인 로직이 필요할지 고민입니다.
    console.log("[예심 논문 심사]] 단계인 학생을 [예심 논문 최종 심사] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        where: {
          phaseId: 2,
        },
        data: {
          phaseId: 3,
        },
      });
    });
  };

  _05 = async () => {
    console.log("[본심 논문 제출] 단계에서 [본심 논문 심사] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        where: {
          phaseId: 4,
          thesisInfos: {
            some: {
              stage: { equals: Stage.MAIN },
              thesisFiles: {
                every: {
                  fileId: { not: null },
                },
              },
            },
          },
        },
        data: {
          phaseId: 5,
        },
      });
    });
  };

  _06 = async () => {
    console.log("[본심 논문 심사] 단계인 학생을 [본심 논문 최종 심사] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        where: {
          phaseId: 5,
        },
        data: {
          phaseId: 6,
        },
      });
    });
  };

  _07 = async () => {
    console.log("[본심 논문 최종 심사] 단계인 학생을 [수정지시사항] 단계나 [논문 실적] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        //수정지시사항으로 넘어가는 케이스
        where: {
          phaseId: 6,
          student: {
            department: {
              modificationFlag: true,
            },
          },
          thesisInfos: {
            every: {
              summary: {
                equals: Status.PASS,
              },
            },
          },
        },
        data: {
          phaseId: 7,
          currentPhase: Stage.REVISION,
        },
      });
      await tx.process.updateMany({
        //논문 실적 단계로 바로 넘어가는 케이스
        where: {
          phaseId: 6,
          student: {
            department: {
              modificationFlag: false,
            },
          },
          thesisInfos: {
            every: {
              summary: { equals: Status.PASS }, // 이경우 thesisinfo는 예심본심 둘다 pass인 상태여야함
            },
          },
        },
        data: {
          phaseId: 9,
        },
      });
    });
  };

  _08 = async () => {
    console.log("[수정 지시 사항 제출] 단계인 학생을 [수정지시사항 심사] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        where: {
          phaseId: 7,
          thesisInfos: {
            some: {
              stage: { equals: Stage.REVISION },
              thesisFiles: {
                every: {
                  fileId: { not: null },
                },
              },
            },
          },
        },
        data: {
          phaseId: 8,
        },
      });
    });
  };

  _09 = async () => {
    console.log("[수정지시 사항 제출] 단계를 통과한 학생을 [논문 실적 제출] 단계로 업데이트합니다.");
    await this.prismaService.$transaction(async (tx) => {
      await tx.process.updateMany({
        where: {
          phaseId: 8,
          thesisInfos: {
            every: {
              summary: { equals: Status.PASS },
            },
          },
        },
        data: {
          phaseId: 9,
        },
      });
    });
  };

  _10 = async () => {};
}
