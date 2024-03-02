import { Body, Controller, Param, Put, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/guards/jwt.guard";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { ThesesService } from "./theses.service";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";
import { UpdateThesisInfoDto } from "./dtos/update-thesis.dto";
import { ThesisInfoDto } from "./dtos/thesis-info.dto";

@Controller("theses")
@UseGuards(JwtGuard)
@ApiTags("논문 정보 API")
@ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
@ApiBearerAuth("access-token")
export class ThesesController {
  constructor(private readonly thesesService: ThesesService) {}

  @Put(":id")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({
    summary: "학생 논문 정보 수정 API(관리자 페이지 용)",
    description:
      "아이디에 해당하는 학생의 현재 단계에 해당하는 논문 정보를 수정할 수 있다.\n\n'논문 제목', '논문 초록', '논문 파일', '발표 파일', '수정지시사항 보고서' 수정 가능",
  })
  @ApiUnauthorizedResponse({ description: "[관리자] 로그인 후 접근 가능" })
  @ApiBadRequestResponse({ description: "잘못된 요청" })
  @ApiOkResponse({
    description: "학생 논문 정보 수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(ThesisInfoDto) }],
    },
  })
  async updateThesis(@Param("id", PositiveIntPipe) id: number, @Body() updateThesisInfoDto: UpdateThesisInfoDto) {
    const updateThesisInfo = await this.thesesService.updateThesis(id, updateThesisInfoDto);
    const thesisInfoDto = new ThesisInfoDto(updateThesisInfo);
    return new CommonResponseDto(thesisInfoDto);
  }
}
