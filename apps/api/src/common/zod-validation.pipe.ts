import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { z, type ZodType } from "zod";

export type ApiValidationError = { field: string; message: string };

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors: ApiValidationError[] = result.error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join(".") : "body",
        message: issue.message,
      }));
      throw new BadRequestException({ success: false, errors });
    }
    return result.data;
  }
}

export const objectSchema = z.object;
