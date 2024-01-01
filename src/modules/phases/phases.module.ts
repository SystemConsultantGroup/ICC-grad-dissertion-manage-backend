import { Module } from "@nestjs/common";
import { PhasesService } from "./phases.service";
import { PhasesController } from "./phases.controller";

@Module({
  providers: [PhasesService],
  controllers: [PhasesController],
})
export class PhasesModule {}
