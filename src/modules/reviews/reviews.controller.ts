import { Body, Controller, Get, Param, UseGuards, ParseIntPipe, Res } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import { ApiPaginationOKResponse } from "src/common/decorators/api-pagination-ok-response.decorator";
import { Put, Query } from "@nestjs/common/decorators";
import { ReviewsService } from "./reviews.service";
import { UserType, User } from "@prisma/client";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { GetReviewListResDto } from "./dtos/get-review-list.res.dto";
import { PageDto } from "src/common/dtos/pagination.dto";
import { Response } from "express";
import { StreamableFile } from "@nestjs/common/file-stream";
import { GetReviewResDto } from "./dtos/get-review.res.dto";
import { UpdateReviewReqDto } from "./dtos/update-review.req.dto";
import { GetReviewFinalResDto } from "./dtos/get-review-final.res.dto";
import { SearchReviewReqDto } from "./dtos/search-review.req.dto";
import { SearchResultReqDto } from "./dtos/search-result.req.dto";
import { getCurrentTime } from "src/common/utils/date.util";
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";

@ApiTags("심사정보 API")
@UseGuards(JwtGuard)
@ApiBearerAuth("access-token")
@Controller("reviews")
@ApiExtraModels(CommonResponseDto, GetReviewListResDto)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: "심사 대상 논문 리스트 조회 API",
    description: "로그인한 교수가 심사해야하는 논문 리스트를 조회할 수 있다.",
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetReviewListResDto,
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get()
  async getReviewList(@Query() searchQuery: SearchReviewReqDto, @CurrentUser() user: User) {
    const reviews = await this.reviewsService.getReviewList(searchQuery, user);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, reviews.length, reviews);
    return new CommonResponseDto(pageDto);
  }

  @ApiOperation({
    summary: "심사 대상 논문 리스트 엑셀 다운로드 API",
    description: "로그인한 교수가 심사해야하는 논문 리스트를 엑셀로 다운로드 할 수 있다.",
  })
  @ApiOkResponse({
    description: "조회 성공",
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("excel")
  async getReviewListExcel(
    @Query() searchQuery: SearchReviewReqDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response
  ) {
    const file = await this.reviewsService.getReviewListExcel(searchQuery, user);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + file["filename"]);
    return new StreamableFile(file["file"]);
  }

  @ApiOperation({
    summary: "최종 심사 대상 논문 리스트 조회 API",
    description: "로그인한 교수가 최종심사해야하는 논문 리스트를 조회할 수 있다.",
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetReviewListResDto,
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("final")
  async getReviewFinalList(@Query() searchQuery: SearchReviewReqDto, @CurrentUser() user: User) {
    const reviews = await this.reviewsService.getReviewFinalList(searchQuery, user);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, reviews.length, reviews);
    return new CommonResponseDto(pageDto);
  }

  @ApiOperation({
    summary: "최종 심사 대상 논문 리스트 엑셀 다운로드 API",
    description: "로그인한 교수가 심사해야하는 논문 리스트를 엑셀로 다운로드 할 수 있다.",
  })
  @ApiOkResponse({
    description: "조회 성공",
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("final/excel")
  async getReviewListFinalExcel(
    @Query() searchQuery: SearchReviewReqDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response
  ) {
    const file = await this.reviewsService.getReviewListFinalExcel(searchQuery, user);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + file["filename"]);
    return new StreamableFile(file["file"]);
  }

  @ApiOperation({
    summary: "전체 심사결과 리스트 조회",
    description: "심사가 끝난 논문의 전체 심사 결과 리스트를 조회할 수 있다.",
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetReviewListResDto,
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("result")
  async getResultList(@Query() searchQuery: SearchResultReqDto) {
    const results = await this.reviewsService.getResultList(searchQuery);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, results.length, results);
    return new CommonResponseDto(pageDto);
  }

  @ApiOperation({
    summary: "전체 심사결과 리스트 엑셀 다운로드 API",
    description: "전체 심사결과 리스트를 엑셀로 다운로드 할 수 있다.",
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("result/excel")
  async getResultExcel(@Query() searchQuery: SearchResultReqDto, @Res({ passthrough: true }) res: Response) {
    const file = await this.reviewsService.getResultExcel(searchQuery);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + file["filename"]);
    return new StreamableFile(file["file"]);
  }

  @ApiOperation({
    summary: "논문 심사 정보 조회 API",
    description: "심사 정보를 조회할 수 있다.",
  })
  @ApiExtraModels(GetReviewResDto)
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get(":id")
  async getReview(@Param("id", PositiveIntPipe) id: number, @CurrentUser() user: User) {
    const review = await this.reviewsService.getReview(id, user);
    return new CommonResponseDto(new GetReviewResDto(review));
  }

  @ApiOperation({
    summary: "논문 심사 정보 수정 API",
    description: "심사 정보를 수정할 수 있다.",
  })
  @ApiExtraModels(GetReviewResDto)
  @ApiNoContentResponse({
    description: "수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiInternalServerErrorResponse({ description: "수정 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Put(":id")
  async updateReview(
    @Param("id", PositiveIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewReqDto,
    @CurrentUser() user: User
  ) {
    const review = await this.reviewsService.updateReview(id, updateReviewDto, user);
    return new CommonResponseDto(new GetReviewResDto(review));
  }

  @ApiOperation({
    summary: "최종 논문 심사 정보 조회 API",
    description: "최종 심사 정보를 조회할 수 있다.",
  })
  @ApiExtraModels(GetReviewResDto)
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("final/:id")
  async getReviewFinal(@Param("id", PositiveIntPipe) id: number, @CurrentUser() user: User) {
    const review = await this.reviewsService.getReviewFinal(id, user);
    return new CommonResponseDto(new GetReviewFinalResDto(review));
  }

  @ApiOperation({
    summary: "최종 논문 심사 정보 수정 API",
    description: "심사 정보를 수정할 수 있다.",
  })
  @ApiExtraModels(GetReviewResDto)
  @ApiNoContentResponse({
    description: "수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Put("final/:id")
  async updateReviewFinal(
    @Param("id", PositiveIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewReqDto,
    @CurrentUser() user: User
  ) {
    const review = await this.reviewsService.updateReviewFinal(id, updateReviewDto, user);
    return new CommonResponseDto(new GetReviewFinalResDto(review));
  }
}
