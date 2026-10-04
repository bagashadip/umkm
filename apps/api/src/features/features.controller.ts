import { Controller, Get } from "@nestjs/common";
import { FeaturesService } from "./features.service";

@Controller("features")
export class FeaturesController {
  constructor(private readonly features: FeaturesService) {}
  @Get()
  list() { return this.features.list(); }
}
