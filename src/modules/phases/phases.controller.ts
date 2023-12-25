import { Controller, Get, UseGuards } from "@nestjs/common";
import { PhasesService } from "./phases.service";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { PhaseDto, PhasesListDto } from "./dtos/phase-response.dto";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "@prisma/client";

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
}
