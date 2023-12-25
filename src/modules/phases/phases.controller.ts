import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { PhasesService } from "./phases.service";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { PhaseDto, PhasesListDto } from "./dtos/phase-response.dto";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";
import { UpdatePhaseDto } from "./dtos/update-phase.dto";

@ApiTags("시스템 일정 API")
@ApiBearerAuth("access-token")
@UseGuards(JwtGuard)
@Controller("phases")
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @UseUserTypeGuard([UserType.ADMIN])
  @Get()
  @ApiOperation({ summary: "모든 시스템 단계 일정 조회" })
  @ApiOkResponse({
    description: "시스템 단계 리스트 조회 성공",
    type: PhaseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: "관리자만 접근 가능" })
  async getPhaseList(): Promise<CommonResponseDto<PhasesListDto>> {
    const phases = await this.phasesService.getPhaseList();

    return new CommonResponseDto(new PhasesListDto(phases));
  }

  @UseUserTypeGuard([UserType.ADMIN])
  @Get("current")
  @ApiOperation({ summary: "현재 시스템 단계 조회" })
  @ApiOkResponse({
    description: "현재 시스템 단계 조회 성공",
    type: PhaseDto,
  })
  @ApiUnauthorizedResponse({ description: "관리자만 접근 가능" })
  @ApiInternalServerErrorResponse({ description: "현재 시스템 단계 존재하지 않음" })
  async getCurrentPhase() {
    const phases = await this.phasesService.getCurrentPhases();
    return new CommonResponseDto(new PhasesListDto(phases));
  }

  @Put(":id")
  @UseUserTypeGuard([UserType.ADMIN])
  @ApiOperation({ summary: "시스템 일정 수정" })
  @ApiBody({ type: UpdatePhaseDto })
  @ApiOkResponse({ description: "시스템 단계 업데이트 성공" })
  @ApiBadRequestResponse({ description: "존재하지 않는 단계거나 기간설정 오류" })
  async updatePhase(@Param("id", ParseIntPipe) id: number, @Body() updatePhaseDto: UpdatePhaseDto) {
    await this.phasesService.updatePhase(id, updatePhaseDto);

    return new CommonResponseDto();
  }
}
