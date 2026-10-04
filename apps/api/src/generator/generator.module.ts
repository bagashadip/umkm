import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GeneratorService } from "./generator.service";

@Module({
  imports: [PrismaModule],
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
