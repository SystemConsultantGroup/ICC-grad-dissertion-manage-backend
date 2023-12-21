import { utilities, WinstonModule } from "nest-winston";
import * as winstonDaily from "winston-daily-rotate-file";
import * as winston from "winston";
import * as packageJson from "package.json";

/**
 * @author Yi Kanghoon
 * @description Winston 기반 로그 파일 생성
 */
// error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === "production" ? "http" : "silly",
      format:
        process.env.NODE_ENV === "production"
          ? winston.format.simple()
          : winston.format.combine(
              winston.format.colorize({ all: true }),
              winston.format.timestamp(),
              utilities.format.nestLike(packageJson.name, {
                prettyPrint: true,
              })
            ),
    }),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winstonDaily({
            level: "info",
            datePattern: "YYYY-MM-DD",
            filename: `logs/info/%DATE%.info.log`,
            maxSize: "1000k",
          }),
          new winstonDaily({
            level: "error",
            datePattern: "YYYY-MM-DD",
            filename: `logs/error/%DATE%.error.log`,
            maxSize: "1000k",
          }),
        ]
      : []),
  ],
});
