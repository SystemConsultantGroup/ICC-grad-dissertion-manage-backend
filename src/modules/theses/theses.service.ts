import { Injectable } from "@nestjs/common";
import { UpdateThesisInfoDto } from "./dtos/update-thesis.dto";

@Injectable()
export class ThesesService {
  async updateThesis(id: number, updateThesisInfoDto: UpdateThesisInfoDto) {
    const { title, abstract, thesisFileUUID, presentationFileUUID, revisionReportFileUUID } = updateThesisInfoDto;

    // id 확인
    // 파일 존재 여부 확인
    // 업데이트 진행
  }
}
