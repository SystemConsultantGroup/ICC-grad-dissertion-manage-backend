import { Module } from "@nestjs/common";
import { ThesesController } from "./theses.controller";
import { ThesesService } from "./theses.service";

@Module({
  controllers: [ThesesController],
  providers: [ThesesService],
})
export class ThesesModule {}
