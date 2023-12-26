import { ApiProperty } from "@nestjs/swagger";
import { Department, File, Process, Stage, Summary, ThesisFile, ThesisInfo, User } from "@prisma/client";
import { FileDto } from "src/modules/files/dtos/file.dto";
import { UserDto } from "src/modules/users/dtos/user.dto";

export class ThesisInfoDto {
  constructor(
    thesisInfo: ThesisInfo & { process: Process & { student: User & { department: Department } } } & {
      thesisFiles: (ThesisFile & { file: File })[];
    }
  ) {
    this.title = thesisInfo.title;
    this.abstract = thesisInfo.abstract;
    this.stage = thesisInfo.stage;
    this.summary = thesisInfo.summary;
    this.studentInfo = thesisInfo.process.student;
    this.thesisFile = thesisInfo.thesisFiles[0].file;
    this.presentationFile = thesisInfo.thesisFiles[1].file;
  }

  @ApiProperty({ description: "논문 제목" })
  title: string;

  @ApiProperty({ description: "논문 초록" })
  abstract: string;

  @ApiProperty({ description: "심사 단계", enum: Stage })
  stage: Stage;

  @ApiProperty({ description: "최종 합격 여부", enum: Summary })
  summary: Summary;

  @ApiProperty({ description: "저자 정보" })
  studentInfo: UserDto;

  @ApiProperty({ description: "논문 파일" })
  thesisFile: FileDto;

  @ApiProperty({ description: "논문 발표 파일" })
  presentationFile: FileDto;
}
