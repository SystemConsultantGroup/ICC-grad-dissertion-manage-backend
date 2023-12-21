import { ConfigService } from "@nestjs/config";
import { BadRequestException, Injectable } from "@nestjs/common";
import * as Minio from "minio";
import { MinioService } from "nestjs-minio-client";

@Injectable()
export class MinioClientService {
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly minioService: MinioService
  ) {
    this.minioClient = this.minioService.client;
    this.bucket = this.configService.get("MINIO_BUCKET_NAME");
  }

  async uploadFile(key: string, file: Buffer, size: number, createdAt: Date, originalName: string, mimeType: string) {
    const metaData = {
      "Content-Type": mimeType,
      createdAt: createdAt.toUTCString(),
      originalName: encodeURI(originalName),
    };

    try {
      await this.minioClient.putObject(this.bucket, key, file, size, metaData);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async removeFile(key: string) {
    try {
      return await this.minioClient.removeObject(this.bucket, key);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getFile(key: string) {
    try {
      return await this.minioClient.getObject(this.bucket, key);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
