import { UseInterceptors, applyDecorators } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";

export function ApiFile(fieldName = "file") {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName)),
    ApiConsumes("multipart/form-data"),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          [fieldName]: {
            type: "string",
            format: "binary",
          },
        },
      },
    })
  );
}
