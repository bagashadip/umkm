import { Controller, Get } from "@nestjs/common";
import { PrototypeService } from "./prototype.service";

@Controller("prototype")
export class PrototypeController {
  constructor(private readonly prototype: PrototypeService) {}
  @Get("sample")
  sample() { return this.prototype.sample(); }
}
