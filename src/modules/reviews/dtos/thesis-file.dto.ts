import { ApiProperty } from "@nestjs/swagger";
import { ThesisFile, ThesisFileType, File } from "@prisma/client";
import { FileDto } from "src/modules/files/dtos/file.dto";

export class ThesisFileDto {
  constructor(thesisFile: ThesisFile & { file: File }) {
    this.id = thesisFile.id;
    this.type = thesisFile.type;
    this.createdAt = thesisFile.createdAt;
    this.updatedAt = thesisFile.updatedAt;
    this.file = thesisFile.file;
  }

  @ApiProperty({ description: "논문파일 아이디" })
  id: number;
  @ApiProperty({ description: "파일 종류" })
  type: ThesisFileType;
  @ApiProperty({ description: "createdAt" })
  createdAt: Date;
  @ApiProperty({ description: "updatedAt" })
  updatedAt: Date;
  @ApiProperty({ description: "파일", type: FileDto })
  file: FileDto;
}
