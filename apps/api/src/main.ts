import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3113")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: false });
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
