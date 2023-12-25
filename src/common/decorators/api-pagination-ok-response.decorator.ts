import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { CommonResponseDto } from "../dtos/common-response.dto";
import { PageDto } from "../dtos/pagination.dto";

export const ApiPaginationOKResponse = <TModel extends Type<any>>(options: { description?: string; dto: TModel }) => {
  return applyDecorators(
    ApiExtraModels(CommonResponseDto, PageDto, options.dto),
    ApiOkResponse({
      description: options.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(CommonResponseDto) },
          { $ref: getSchemaPath(PageDto) },
          {
            properties: {
              contents: {
                type: "array",
                items: { $ref: getSchemaPath(options.dto) },
              },
            },
          },
        ],
      },
    })
  );
};
