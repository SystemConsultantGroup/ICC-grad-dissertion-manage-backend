import { Module } from "@nestjs/common";
import { ProfessorsService } from "./professors.service";
import { ProfessorsController } from "./professors.controller";

@Module({
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
})
export class ProfessorsModule {}
