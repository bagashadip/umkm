import { Injectable } from "@nestjs/common";
import { prototypeConfigSchema, samplePrototypeConfig } from "@umkm/planner-engine";

@Injectable()
export class PrototypeService {
  sample() {
    return prototypeConfigSchema.parse(samplePrototypeConfig);
  }
}
