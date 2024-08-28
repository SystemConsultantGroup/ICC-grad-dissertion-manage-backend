import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { CompressionTypes, Kafka, logLevel, Producer } from "kafkajs";

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.CLIENT_ID,
      brokers: [process.env.KAFKA_CLIENT_BOOTSTRAP_SERVER],
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: 100,
        retries: 10,
        multiplier: 2,
      },
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async sendMessage(topic: string, key: string, message: string, headers: Record<string, string> = {}) {
    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: message, headers }],
        compression: CompressionTypes.GZIP,
        acks: -1,
      });
      console.log(`Message sent to topic ${topic}: ${message}`);
    } catch (error) {
      console.error(`Error sending message to Kafka: ${error.message}`);
    }
  }
}
