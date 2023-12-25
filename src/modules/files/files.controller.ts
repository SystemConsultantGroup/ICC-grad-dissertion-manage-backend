import { Controller, Get, Param, Post, UploadedFile, UseGuards, Response, Delete, ParseUUIDPipe } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtGuard } from "../auth/guards/jwt.guard";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ApiFile } from "./decorators/api-file.decorator";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";

@ApiTags("파일 API")
@ApiBearerAuth("access-token")
@UseGuards(JwtGuard)
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: " 파일 업로드" })
  @ApiFile("file")
  @ApiResponse({ type: CommonResponseDto, status: 201 })
  @ApiInternalServerErrorResponse({ description: "파일 업로드 실패" })
  async uploadFile(@UploadedFile() uploadedFile: Express.Multer.File) {
    const savedFile = await this.filesService.createFile(uploadedFile);

    return new CommonResponseDto(savedFile);
  }

  @Delete(":key")
  @ApiOperation({ summary: " 파일 삭제 " })
  @ApiFile("file")
  @ApiResponse({ type: CommonResponseDto, status: 200 })
  @ApiInternalServerErrorResponse({ description: "파일 삭제 실패" })
  async deleteFile(@Param("key", ParseUUIDPipe) key: string) {
    await this.filesService.deleteFile(key);

    return new CommonResponseDto();
  }

  @Get("excels/student")
  @ApiOperation({ summary: "학생 일괄등록 엑셀 양식 다운로드" })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiResponse({ description: "학생 일괄등록 엑셀 양식", status: 200 })
  @ApiBadRequestResponse({ description: "파일 다운로드 실패" })
  async getStudentExcelForm(@Response() res) {
    const fileName = "정통대대학원논문심사_학생_일괄등록_엘섹_양식.xlsx";
    const stream = await this.filesService.getLocalFile("format", fileName);

    res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @Get("excels/professor")
  @ApiOperation({ summary: "교수 일괄등록 엑셀 양식 다운로드" })
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiResponse({ description: "교수 일괄등록 엑셀 양식", status: 200 })
  @ApiBadRequestResponse({ description: "파일 다운로드 실패" })
  async getProfessorExcelForm(@Response() res) {
    const fileName = "정통대대학원논문심사_교수_일괄등록_양식.xlsx";
    const stream = await this.filesService.getLocalFile("format", fileName);

    res.setHeader("Content-Disposition", `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }
}
