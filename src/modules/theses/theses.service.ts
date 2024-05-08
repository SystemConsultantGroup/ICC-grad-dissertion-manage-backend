import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { UpdateThesisInfoDto } from "./dtos/update-thesis.dto";
import { PrismaService } from "src/config/database/prisma.service";
import { Stage, ThesisFileType } from "@prisma/client";

@Injectable()
export class ThesesService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateThesis(id: number, updateThesisInfoDto: UpdateThesisInfoDto) {
    const { title, abstract, thesisFileUUID, presentationFileUUID, revisionReportFileUUID } = updateThesisInfoDto;

    // id 확인
    const foundThesisInfo = await this.prismaService.thesisInfo.findUnique({
      where: {
        id,
        process: { student: { deletedAt: null } },
      },
      include: {
        thesisFiles: true,
        process: { include: { thesisInfos: true } },
      },
    });
    if (!foundThesisInfo) throw new BadRequestException("해당 논문 정보는 존재하지 않습니다.");
    const targetStage = foundThesisInfo.stage;

    try {
      // 변경하고자 하는 phase에 따라 논문 정보 업데이트 진행 후 리턴
      // 예심 단계일 경우
      if (targetStage === Stage.PRELIMINARY) {
        // 예심의 논문 제목, 초록, 논문 파일, 발표 파일 업데이트
        const preThesisFile = foundThesisInfo.thesisFiles.filter(
          (thesisFile) => thesisFile.type === ThesisFileType.THESIS
        )[0];
        const prePPTFile = foundThesisInfo.thesisFiles.filter(
          (thesisFile) => thesisFile.type === ThesisFileType.PRESENTATION
        )[0];

        return await this.prismaService.thesisInfo.update({
          where: { id },
          data: {
            title,
            abstract,
            thesisFiles: {
              update: [
                {
                  where: { id: preThesisFile.id },
                  data: { fileId: thesisFileUUID },
                },
                {
                  where: { id: prePPTFile.id },
                  data: { fileId: presentationFileUUID },
                },
              ],
            },
          },
          include: {
            process: {
              include: { student: { include: { department: true } } },
            },
            thesisFiles: {
              include: { file: true },
            },
          },
        });
      } // 본심 단계일 경우
      else if (targetStage === Stage.MAIN) {
        // 본심의 논문 제목, 초록, 논문 파일, 논문 발표 파일, 수정단계의 논문 제목, 초록 업데이트
        const mainThesisFile = foundThesisInfo.thesisFiles.filter(
          (thesisFile) => thesisFile.type === ThesisFileType.THESIS
        )[0];
        const mainPPTFile = foundThesisInfo.thesisFiles.filter(
          (thesisFile) => thesisFile.type === ThesisFileType.PRESENTATION
        )[0];

        // 수정 지시사항 단계의 논문 정보 id 찾기 (없는 경우 undefined)
        const revisionThesisInfo = foundThesisInfo.process.thesisInfos.filter(
          (thesisInfo) => thesisInfo.stage === Stage.REVISION
        )[0];

        const [thesisInfo] = await this.prismaService.$transaction([
          // 본심 논문 정보 업데이트
          this.prismaService.thesisInfo.update({
            where: { id },
            data: {
              title,
              abstract,
              thesisFiles: {
                update: [
                  {
                    where: { id: mainThesisFile.id },
                    data: { fileId: thesisFileUUID },
                  },
                  {
                    where: { id: mainPPTFile.id },
                    data: { fileId: presentationFileUUID },
                  },
                ],
              },
            },
            include: {
              process: {
                include: { student: { include: { department: true } } },
              },
              thesisFiles: {
                include: { file: true },
              },
            },
          }),
          // 수정지시사항 논문 정보 업데이트
          this.prismaService.thesisInfo.update({
            where: { id: revisionThesisInfo ? revisionThesisInfo.id : undefined },
            data: {
              title,
              abstract,
            },
          }),
        ]);

        return thesisInfo;
      } // 수정 지시사항 반영 단계일 경우
      else if (targetStage === Stage.REVISION) {
        // 수정 지시사항 단계의 제목, 초록, 수정 논문 파일, 수정 지시사항 보고서, 본심 단계의 논문 제목, 논문 초록 업데이트
        const revisionThesisFile = foundThesisInfo.thesisFiles.filter(
          (thesisFile) => thesisFile.type === ThesisFileType.THESIS
        )[0];
        const revisionReportFile = foundThesisInfo.thesisFiles.filter(
          (thesisFile) => thesisFile.type === ThesisFileType.REVISION_REPORT
        )[0];

        // 본심 단계의 논문 정보 찾기
        const mainThesisInfo = foundThesisInfo.process.thesisInfos.filter(
          (thesisInfo) => thesisInfo.stage === Stage.MAIN
        )[0];

        const [thesisInfo] = await this.prismaService.$transaction([
          // 수정지시사항 논문 정보 업데이트
          this.prismaService.thesisInfo.update({
            where: { id },
            data: {
              title,
              abstract,
              thesisFiles: {
                update: [
                  {
                    where: { id: revisionThesisFile.id },
                    data: { fileId: thesisFileUUID },
                  },
                  {
                    where: { id: revisionReportFile.id },
                    data: { fileId: revisionReportFileUUID },
                  },
                ],
              },
            },
            include: {
              process: {
                include: { student: { include: { department: true } } },
              },
              thesisFiles: {
                include: { file: true },
              },
            },
          }),
          // 본심 논문 정보 업데이트
          this.prismaService.thesisInfo.update({
            where: { id: mainThesisInfo.id },
            data: {
              title,
              abstract,
            },
          }),
        ]);

        return thesisInfo;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("업데이트 실패");
    }
  }
}
