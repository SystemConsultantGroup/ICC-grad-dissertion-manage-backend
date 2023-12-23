import { Controller, Get, Param, Post, UploadedFile, UseGuards, Response } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiFile } from "./decorators/api-file.decorator";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";

@ApiTags("파일 API")
@UseGuards(JwtGuard)
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: " 파일 업로드" })
  @ApiFile("file")
  async uploadFile(@UploadedFile() uploadedFile: Express.Multer.File) {
    const savedFile = await this.filesService.createFile(uploadedFile);

    return new CommonResponseDto(savedFile);
  }

  @Get(":uuid")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: " 파일 다운로드" })
  @ApiFile("file")
  async getFile(@Param("key") key: string, @Response() res) {
    const { fileName, stream } = await this.filesService.getFile(key);
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @Get("excels/student")
  @ApiOperation({ summary: "학생 일괄등록 엑셀 양식 다운로드" })
  @ApiBearerAuth("access-token")
  @UseUserTypeGuard([UserType.ADMIN])
  async getStudentExcelForm(@Response() res) {
    const fileName = "정통대대학원논문심사_학생_일괄등록_엘섹_양식.xlsx";
    const stream = await this.filesService.getLocalFile("format", fileName);

    res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @Get("excels/professors")
  @ApiOperation({ summary: "교수 일괄등록 엑셀 양식 다운로드" })
  @ApiBearerAuth("access-token")
  @UseUserTypeGuard([UserType.ADMIN])
  async getProfessorExcelForm(@Response() res) {
    const fileName = "정통대대학원논문심사_교수_일괄등록_양식.xlsx";
    const stream = await this.filesService.getLocalFile("format", fileName);

    res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }
}
