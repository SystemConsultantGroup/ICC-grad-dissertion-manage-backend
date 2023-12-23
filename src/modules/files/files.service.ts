import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import { PrismaService } from "src/config/database/prisma.service";
import { MinioClientService } from "src/config/file/minio-client.service";
import { v1 } from "uuid";
@Injectable()
export class FilesService {
  constructor(
    private readonly minioClientService: MinioClientService,
    private readonly prismaService: PrismaService
  ) {}

  async createFile(uploadedFile: Express.Multer.File) {
    try {
      return await this.prismaService.$transaction(
        async (tx) => {
          const { originalname, mimetype, size, buffer } = uploadedFile;
          const createdAt = new Date();
          const key = v1();

          await this.minioClientService.uploadFile(
            key,
            buffer,
            size,
            createdAt,
            Buffer.from(originalname, "latin1").toString("utf8"),
            mimetype
          );
          return await tx.file.create({
            data: {
              name: Buffer.from(originalname, "latin1").toString("utf8"),
              mimeType: mimetype,
              uuid: key,
              createdAt: createdAt,
            },
          });
        },
        {
          maxWait: 4000,
          timeout: 4000,
        }
      );
    } catch (error) {
      throw new InternalServerErrorException("파일 업로드에 문제가 발생하였습니다");
    }
  }

  async getFile(key: string): Promise<any> {
    try {
      const [fileName, stream] = await this.prismaService.$transaction(async (tx) => {
        const file = await tx.file.findFirst({
          where: {
            uuid: key,
          },
        });
        const stream = await this.minioClientService.getFile(key);
        return [file.name, stream];
      });
      return { fileName, stream };
    } catch (error) {
      throw new InternalServerErrorException("파일 탐색에 문제가 발생하였습니다");
    }
  }

  async getLocalFile(directory: string, filename: string) {
    const filePath = path.join("resources", directory, filename);
    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath);

      return stream;
    } else {
      throw new InternalServerErrorException("파일을 찾을 수 없습니다.");
    }
  }
}
