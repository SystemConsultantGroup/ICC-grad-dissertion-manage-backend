import { Body, Controller, Delete, Get, Param, Post, Put, Query, Response, UseGuards } from "@nestjs/common";
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
import { AchievementsExcelQuery, AchievementsSearchQuery, PostAchievementQuery } from "./dtos/achievements-query.dto";
import { PageDto } from "../../common/dtos/pagination.dto";
import { AchievementDto, CreateAchievementResponseDto } from "./dtos/achievement.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { CommonResponseDto } from "../../common/dtos/common-response.dto";
import { UpdateAchievementsDto } from "./dtos/update-achievements.dto";
import { ApiPaginationOKResponse } from "../../common/decorators/api-pagination-ok-response.decorator";
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
  @Post()
  @ApiCreatedResponse({
    description: "논문 실적 등록 성공",
    type: CreateAchievementResponseDto,
  })
  @ApiBadRequestResponse({
    description: "해당 유저는 존재하지 않습니다",
  })
  @ApiUnauthorizedResponse({
    description: "본인의 논문 실적만 등록이 가능합니다(학생인경우)",
  })
  async createAchievement(
    @Query() postAchievementQuery: PostAchievementQuery,
    @CurrentUser() user: User,
    @Body() createAchievementsDto: CreateAchievementsDto
  ) {
    const newAchievement = await this.achievemenstService.createAchievement(
      postAchievementQuery.id,
      user,
      createAchievementsDto
    );
    return new CommonResponseDto(new CreateAchievementResponseDto(newAchievement));
  }

  @ApiOperation({
    summary: "논문실적 조회",
    description: "관리자와 학생모두 이 api를 통해 논문실적을 조회합니다.",
  })
  @ApiPaginationOKResponse({
    description: "논문 실적 조회 성공",
    dto: AchievementDto,
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

  @ApiOperation({
    summary: "논문 실적 수정",
    description: "논문 실적 수정",
  })
  @ApiOkResponse({
    description: "논문실적 수정 성공",
    type: CommonResponseDto,
  })
  @UseUserTypeGuard([UserType.STUDENT])
  @Put(":id")
  async updateAchievement(
    @Param("id", PositiveIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateAchievementDto: UpdateAchievementsDto
  ) {
    await this.achievemenstService.updateAchievement(id, user, updateAchievementDto);
    return new CommonResponseDto();
  }

  @ApiOperation({
    summary: "전체 학생 논문실적 엑셀파일 생성",
    description: "전체 학생 논문실적 엑셀파일 생성",
  })
  @ApiUnauthorizedResponse({ description: "관리자만 권한 허용" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("excel")
  async getAchievementsExcel(@Query() achievementsExcelQuery: AchievementsExcelQuery, @Response() res) {
    const { fileName, stream } = await this.achievemenstService.getAchievementsExcel(achievementsExcelQuery);

    res.setHeader(`Content-Disposition`, `attachment; filename=${encodeURI(fileName)}`);
    stream.pipe(res);
  }

  @ApiOperation({
    summary: "특정 논문실적 조회",
  })
  @ApiOkResponse({
    description: "논문 실적 조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(CreateAchievementResponseDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "논문 실적 조회 실패" })
  @ApiUnauthorizedResponse({ description: "학생은 본인 논문실적만 조회 허용" })
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT])
  @Get(":id")
  async getAchievement(@Param("id", PositiveIntPipe) id: number, @CurrentUser() user: User) {
    const achievement = await this.achievemenstService.getAchievement(id, user);
    return new CommonResponseDto(new CreateAchievementResponseDto(achievement));
  }

  @ApiOperation({
    summary: "특정 논문실적 삭제",
  })
  @ApiOkResponse({
    description: "논문 실적 삭제 성공",
    type: CommonResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: "논문 실적 삭제 실패" })
  @ApiUnauthorizedResponse({ description: "학생은 본인 논문실적만 삭제 허용" })
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT])
  @Delete(":id")
  async deleteAchievement(@Param("id", PositiveIntPipe) id: number, @CurrentUser() user: User) {
    await this.achievemenstService.deleteAchievement(id, user);
    return new CommonResponseDto();
  }
}
