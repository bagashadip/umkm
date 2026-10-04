import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { FeaturesModule } from "./features/features.module";
import { GeneratorModule } from "./generator/generator.module";
import { PlannerModule } from "./planner/planner.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrototypeModule } from "./prototype/prototype.module";
import { WebsiteFlowModule } from "./website-flow/website-flow.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, PlannerModule, AiModule, FeaturesModule, PrototypeModule, WebsiteFlowModule, GeneratorModule],
})
export class AppModule {}
