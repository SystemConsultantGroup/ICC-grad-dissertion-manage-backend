import { Controller, Get, Param, Post, UploadedFile, UseGuards, Response } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiFile } from "./decorators/api-file.decorator";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";

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
}
