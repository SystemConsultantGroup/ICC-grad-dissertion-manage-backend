import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.setGlobalPrefix("v1");

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  app.enableCors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  });
  app.enableShutdownHooks();

  const appConfig = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle("ICE GS THESIS Backend")
    .setDescription("API Description")
    .setVersion("1.0")
    .addTag("API")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(appConfig.get("app.port"));
  console.log(`==== Running as ${process.env.APP_ENV} ====`);
}
bootstrap();
