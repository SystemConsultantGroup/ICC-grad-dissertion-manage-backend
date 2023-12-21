import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  imports: [AuthModule],
})
export class StudentsModule {}
