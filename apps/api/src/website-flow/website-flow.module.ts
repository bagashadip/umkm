import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { WebsiteFlowController } from "./website-flow.controller";
import { WebsiteFlowService } from "./website-flow.service";

@Module({
  imports: [AiModule],
  controllers: [WebsiteFlowController],
  providers: [WebsiteFlowService],
  exports: [WebsiteFlowService],
})
export class WebsiteFlowModule {}
