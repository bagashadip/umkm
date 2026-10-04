import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { PlannerController } from "./planner.controller";
import { PlannerService } from "./planner.service";

@Module({
  imports: [AiModule],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
