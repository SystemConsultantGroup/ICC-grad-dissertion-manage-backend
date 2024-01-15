import { Module } from "@nestjs/common";
import { AchievementsController } from "./achievements.controller";
import { AchievementsService } from "./achievements.service";

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
