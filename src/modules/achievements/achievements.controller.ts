import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AchievementsService } from "./achievements.service";
import { PositiveIntPipe } from "../../common/pipes/positive-int.pipe";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { CreateAchievementsDto } from "./dtos/create-achievements.dto";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { UserType } from "../../common/enums/user-type.enum";
import { AchievementsSearchQuery } from "./dtos/achievements-query.dto";
import { PageDto } from "../../common/dtos/pagination.dto";
import { AchievementDto } from "./dtos/achievement.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
@ApiTags("논문실적 API")
@UseGuards(JwtGuard)
@ApiBearerAuth("access-token")
@Controller("achievements")
export class AchievementsController {
  constructor(private readonly achievemenstService: AchievementsService) {}

  @ApiOperation({
    summary: "논문실적 등록",
    description: "논문실적 등록",
  })
  @UseUserTypeGuard([UserType.STUDENT])
  @Post(":id")
  @ApiCreatedResponse({
    description: '논문 실적 등록 성공',
    type: CommonResponseDto
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 유저의 논문 실적을 등록하려고 하였습니다'
  })
  @ApiUnauthorizedResponse({
    description: '학생 권한 접근 가능'
  })
  async createAchievement(
    @Param("id", PositiveIntPipe) id,
    @Body() createAchievementsDto: CreateAchievementsDto
  ) {
    await this.achievemenstService.createAchievement(id, createAchievementsDto);
  }

  @ApiOperation({
    summary: "논문실적 조회",
    description: "관리자와 학생모두 이 api를 통해 논문실적을 조회합니다.",
  })
  @ApiOkResponse({
    description: "논문 실적 조회 성공",
    type: [AchievementDto],
  })
  @ApiInternalServerErrorResponse({
    description: "논문 조회 실패",
  })
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT])
  @Get()
  async getAchievements(@Query() achievementsQuery: AchievementsSearchQuery, @CurrentUser() currentUser: User) {
    const { achievements, counts } = await this.achievemenstService.getAchievements(currentUser, achievementsQuery);
    const pageDto = new PageDto(
      achievementsQuery.pageNumber,
      achievementsQuery.pageSize,
      counts,
      achievements.map((achievement) => {
        return new AchievementDto(achievement);
      })
    );
    return new CommonResponseDto(pageDto);
  }
}
