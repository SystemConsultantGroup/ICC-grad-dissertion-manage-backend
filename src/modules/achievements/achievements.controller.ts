import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AchievementsService } from "./achievements.service";
import { PositiveIntPipe } from "../../common/pipes/positive-int.pipe";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
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
  @Post(":userId")
  async createAchievement(
    @Param("userId", PositiveIntPipe) userId,
    @Body() createAchievementsDto: CreateAchievementsDto
  ) {
    await this.achievemenstService.createAchievement(userId, createAchievementsDto);
  }

  @ApiOperation({
    summary: "논문실적 조회",
    description: "논문실적 조회",
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
