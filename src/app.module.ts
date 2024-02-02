import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigModule } from "./config/app/config.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MinioClientModule } from "./config/file/minio-client.module";
import { StudentsModule } from "./modules/students/students.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { UsersModule } from "./modules/users/users.module";
import { FilesModule } from "./modules/files/files.module";
import { PhasesModule } from "./modules/phases/phases.module";
import { ProfessorsModule } from "./modules/professors/professors.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { TaskModule } from "./modules/task/task.module";
import { AchievementsModule } from "./modules/achievements/achievements.module";

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    MinioClientModule,
    DepartmentsModule,
    FilesModule,
    UsersModule,
    StudentsModule,
    PhasesModule,
    ProfessorsModule,
    ReviewsModule,
    TaskModule,
    AchievementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
