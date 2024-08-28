import { Module } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { ReviewsController } from "./reviews.controller";
import { JwtStrategy } from "../auth/jwt/jwt.strategy";
import { KafkaModule } from "../../config/kafka/kafka.module";

@Module({
  imports: [KafkaModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtStrategy],
})
export class ReviewsModule {}
