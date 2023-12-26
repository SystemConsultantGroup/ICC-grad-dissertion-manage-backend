import { Body, Controller, Get, Param, UseGuards, ParseIntPipe, Res } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
  ApiQuery,
  ApiNoContentResponse,
  ApiParam,
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

@ApiTags("reviews API")
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
  @ApiQuery({
    name: "pageNumber",
    required: true,
  })
  @ApiQuery({
    name: "pageSize",
    required: true,
  })
  @ApiQuery({
    name: "author",
    required: false,
  })
  @ApiQuery({
    name: "department",
    required: false,
  })
  @ApiQuery({
    name: "stage",
    required: false,
  })
  @ApiQuery({
    name: "title",
    required: false,
  })
  @ApiQuery({
    name: "status",
    required: false,
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetReviewListResDto,
  })
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
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("excel")
  async getReviewListExcel(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    const excel = await this.reviewsService.getReviewListExcel(user);
    const today = new Date();
    const year = today.getFullYear();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const dateStr = year + month + day;
    const fileName = encodeURIComponent("심사_대상_논문_목록_" + dateStr + ".xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    return new StreamableFile(excel);
  }

  @ApiOperation({
    summary: "최종 심사 대상 논문 리스트 조회 API",
    description: "로그인한 교수가 최종심사해야하는 논문 리스트를 조회할 수 있다.",
  })
  @ApiQuery({
    name: "pageNumber",
    required: true,
  })
  @ApiQuery({
    name: "pageSize",
    required: true,
  })
  @ApiQuery({
    name: "author",
    required: false,
  })
  @ApiQuery({
    name: "department",
    required: false,
  })
  @ApiQuery({
    name: "stage",
    required: false,
  })
  @ApiQuery({
    name: "title",
    required: false,
  })
  @ApiQuery({
    name: "status",
    required: false,
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetReviewListResDto,
  })
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
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("final/excel")
  async getReviewListFinalExcel(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    const excel = await this.reviewsService.getReviewListFinalExcel(user);
    const today = new Date();
    const year = today.getFullYear();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const dateStr = year + month + day;
    const fileName = encodeURIComponent("최종_심사_대상_논문_목록_" + dateStr + ".xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    return new StreamableFile(excel);
  }

  @ApiOperation({
    summary: "전체 심사결과 리스트 조회",
    description: "심사가 끝난 논문의 전체 심사 결과 리스트를 조회할 수 있다.",
  })
  @ApiQuery({
    name: "author",
    required: false,
  })
  @ApiQuery({
    name: "department",
    required: false,
  })
  @ApiQuery({
    name: "stage",
    required: false,
  })
  @ApiQuery({
    name: "title",
    required: false,
  })
  @ApiQuery({
    name: "summary",
    required: false,
  })
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewListResDto) }],
    },
  })
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
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("result/excel")
  async getResultExcel(@Res({ passthrough: true }) res: Response) {
    const excel = await this.reviewsService.getResultExcel();
    const today = new Date();
    const year = today.getFullYear();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const dateStr = year + month + day;
    const fileName = encodeURIComponent("전체_심사_결과_목록_" + dateStr + ".xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    return new StreamableFile(excel);
  }

  @ApiOperation({
    summary: "논문 심사 정보 조회 API",
    description: "심사 정보를 조회할 수 있다.",
  })
  @ApiParam({
    name: "id",
    required: true,
  })
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewResDto) }],
    },
  })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get(":id")
  async getReview(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: User) {
    const review = await this.reviewsService.getReview(id, user);
    return new CommonResponseDto(new GetReviewResDto(review));
  }

  @ApiOperation({
    summary: "논문 심사 정보 수정 API",
    description: "심사 정보를 수정할 수 있다.",
  })
  @ApiParam({
    name: "id",
    required: true,
  })
  @ApiNoContentResponse({
    description: "수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewResDto) }],
    },
  })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Put(":id")
  async updateReview(
    @Param("id", ParseIntPipe) id: number,
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
  @ApiParam({
    name: "id",
    required: true,
  })
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewFinalResDto) }],
    },
  })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("final/:id")
  async getReviewFinal(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: User) {
    const review = await this.reviewsService.getReviewFinal(id, user);
    return new CommonResponseDto(new GetReviewFinalResDto(review));
  }

  @ApiOperation({
    summary: "최종 논문 심사 정보 수정 API",
    description: "심사 정보를 수정할 수 있다.",
  })
  @ApiParam({
    name: "id",
    required: true,
  })
  @ApiNoContentResponse({
    description: "수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewFinalResDto) }],
    },
  })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Put("final/:id")
  async updateReviewFinal(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewReqDto,
    @CurrentUser() user: User
  ) {
    const review = await this.reviewsService.updateReviewFinal(id, updateReviewDto, user);
    return new CommonResponseDto(new GetReviewFinalResDto(review));
  }
}
