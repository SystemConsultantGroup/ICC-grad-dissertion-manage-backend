import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import { PrismaModule } from "../database/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      ...(process.env.APP_ENV !== "production" && { envFilePath: ".env" }),
    }),
    PrismaModule,
  ],
})
export class AppConfigModule {}
