import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { UpdateThesisInfoDto } from "./dtos/update-thesis.dto";
import { PrismaService } from "src/config/database/prisma.service";
import { ThesisFileType } from "@prisma/client";

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
      include: { thesisFiles: true },
    });
    if (!foundThesisInfo) throw new BadRequestException("해당 논문 정보는 존재하지 않습니다.");

    // 파일 존재 여부 확인 & 파일 업데이트 쿼리 미리 작성
    const newFileQuery = [];
    if (thesisFileUUID) {
      // DB에 파일이 있는지 확인
      const foundThesisFile = await this.prismaService.file.findUnique({
        where: { uuid: thesisFileUUID },
        include: { thesisFile: true },
      });
      if (!foundThesisFile) throw new BadRequestException("논문 파일이 존재하지 않습니다.");
      // 업데이트 쿼리에 추가
      const currentThesisFile = foundThesisInfo.thesisFiles.find((file) => file.type === ThesisFileType.THESIS);
      if (!currentThesisFile) throw new BadRequestException("논문 파일을 업데이트할 수 없습니다.");
      newFileQuery.push({ where: { id: currentThesisFile.id }, data: { fileId: thesisFileUUID } });
    }
    if (presentationFileUUID) {
      // DB에 파일이 있는지 확인
      const foundPresentationFile = await this.prismaService.file.findUnique({
        where: { uuid: presentationFileUUID },
        include: { thesisFile: true },
      });
      if (!foundPresentationFile) throw new BadRequestException("논문 발표 파일이 존재하지 않습니다.");
      // 업데이트 쿼리에 추가
      const currentPPTFile = foundThesisInfo.thesisFiles.find((file) => file.type === ThesisFileType.PRESENTATION);
      if (!currentPPTFile) throw new BadRequestException("논문 발표 파일을 업데이트할 수 없습니다.");
      newFileQuery.push({ where: { id: currentPPTFile.id }, data: { fileId: presentationFileUUID } });
    }
    if (revisionReportFileUUID) {
      // DB에 파일이 있는지 확인
      const revisionReportFile = await this.prismaService.file.findUnique({
        where: { uuid: revisionReportFileUUID },
        include: { thesisFile: true },
      });
      if (!revisionReportFile) throw new BadRequestException("수정지시사항 보고서 파일이 존재하지 않습니다.");
      // 업데이트 쿼리에 추가
      const currentRevisionFile = foundThesisInfo.thesisFiles.find(
        (file) => file.type === ThesisFileType.REVISION_REPORT
      );
      if (!currentRevisionFile) throw new BadRequestException("수정지시사항 보고서 파일을 업데이트할 수 없습니다.");
      newFileQuery.push({ where: { id: currentRevisionFile.id }, data: { fileId: revisionReportFileUUID } });
    }

    // 업데이트 진행
    try {
      return await this.prismaService.thesisInfo.update({
        where: { id },
        data: {
          title,
          abstract,
          thesisFiles: {
            update: newFileQuery,
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
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("업데이트 실패");
    }
  }
}
