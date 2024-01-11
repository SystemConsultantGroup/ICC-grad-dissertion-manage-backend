import { Module } from "@nestjs/common";
import { PhasesService } from "./phases.service";
import { PhasesController } from "./phases.controller";
import { TaskModule } from "../task/task.module";

@Module({
  imports: [TaskModule],
  providers: [PhasesService],
  controllers: [PhasesController],
})
export class PhasesModule {}
