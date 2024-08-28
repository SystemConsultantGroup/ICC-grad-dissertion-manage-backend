import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaClientOptions } from "@prisma/client/runtime/library";
@Injectable()
export class PrismaService
  extends PrismaClient<PrismaClientOptions, "query" | "info" | "warn" | "error">
  implements OnModuleInit
{
  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
        { emit: "stdout", level: "error" },
      ],
    });
  }

  async onModuleInit() {
    this.$on("query", (e) => {
      console.log("Query: " + e.query);
      console.log("Paramas: " + e.params);
      console.log("Duration " + e.duration + "ms");
    });
    await this.$connect();
  }
}
