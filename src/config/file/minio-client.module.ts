import { Global, Module } from "@nestjs/common";
import { MinioClientService } from "./minio-client.service";
import { MinioModule } from "nestjs-minio-client";
import { ConfigModule, ConfigService } from "@nestjs/config";
@Global()
@Module({
  imports: [
    MinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        endPoint: configService.get("MINIO_END_POINT"),
        port: parseInt(configService.get("MINIO_PORT")),
        useSSL: true, //tls나 ssl 적용 필요
        accessKey: configService.get("MINIO_ACCESS_KEY"),
        secretKey: configService.get("MINIO_SECRET_KEY"),
      }),
    }),
  ],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioClientModule {}
