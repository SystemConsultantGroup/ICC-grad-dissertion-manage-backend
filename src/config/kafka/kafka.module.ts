import { Module } from "@nestjs/common";
import { KafkaProducer } from "./kafka.service";

@Module({
  providers: [KafkaProducer],
  exports: [KafkaProducer],
})
export class KafkaModule {}
