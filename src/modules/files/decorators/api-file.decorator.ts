import { UseInterceptors, applyDecorators } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { ExcelFilter } from "src/common/pipes/excel.filter";

export function ApiFile(fieldName = "file", isExcel: boolean = false) {
  const fileFilter = isExcel ? ExcelFilter : undefined;
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, { fileFilter: fileFilter })),
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
