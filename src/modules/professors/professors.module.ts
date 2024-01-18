import { Module } from "@nestjs/common";
import { ProfessorsService } from "./professors.service";
import { ProfessorsController } from "./professors.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
  imports: [AuthModule],
})
export class ProfessorsModule {}
