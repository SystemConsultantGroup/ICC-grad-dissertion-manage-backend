import { Module } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { DepartmentsController } from "./departments.controller";
import { StudentsModule } from "../students/students.module";

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  imports: [StudentsModule],
})
export class DepartmentsModule {}
