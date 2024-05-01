import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { AuthModule } from "../auth/auth.module";
import { FilesModule } from "../files/files.module";

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  imports: [AuthModule, FilesModule],
  exports: [StudentsService],
})
export class StudentsModule {}
