import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { winstonLogger } from "./config/logger/winston/winston.config";
import { ResponseInterceptor } from "./config/metrics/interceptors/response.prom.interceptor";
import { PrometheusInterceptor } from "./config/metrics/interceptors/request.prom.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

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
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new PrometheusInterceptor());
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
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: "header",
      },
      "access-token"
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(appConfig.get("app.port"));
  console.log(`==== Running as ${process.env.APP_ENV} ====`);
}
bootstrap();
