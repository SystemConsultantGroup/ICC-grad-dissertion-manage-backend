import { Body, Controller, Get, Param, UseGuards, Res } from "@nestjs/common";
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
import { PositiveIntPipe } from "src/common/pipes/positive-int.pipe";
import { UpdateReviewFinalReqDto } from "./dtos/update-review-final.req.dto";
import { SearchRevisionReqDto } from "./dtos/search-revision.req.dto";
import { GetRevisionResDto } from "./dtos/get-revision.res.dto";
import { GetResultResDto } from "./dtos/get-result.res.dto";
import { SearchCurrentReqDto } from "./dtos/search-current.req.dto";
import { GetRevisionListResDto } from "./dtos/get-revision-list.res.dto";
import { UpdateRevisionReqDto } from "./dtos/update-revision.req.dto";

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
    const { reviews, totalCount } = await this.reviewsService.getReviewList(searchQuery, user);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, totalCount, reviews);
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
    const { reviews, totalCount } = await this.reviewsService.getReviewFinalList(searchQuery, user);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, totalCount, reviews);
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
    summary: "수정 확인 대상 논문 리스트 조회 API",
    description: "로그인한 교수가 수정확인 해야하는 논문 리스트를 조회할 수 있다.",
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetRevisionListResDto,
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("revision")
  async getRevisionList(@Query() searchQuery: SearchRevisionReqDto, @CurrentUser() user: User) {
    const { reviews, totalCount } = await this.reviewsService.getRevisionList(searchQuery, user);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, totalCount, reviews);
    return new CommonResponseDto(pageDto);
  }

  @ApiOperation({
    summary: "수정 확인 대상 논문 리스트 엑셀 다운로드 API",
    description: "로그인한 교수가 수정확인 해야하는 논문 리스트를 엑셀로 다운로드 할 수 있다.",
  })
  @ApiOkResponse({
    description: "조회 성공",
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Get("final/excel")
  async getReivisionListExcel(
    @Query() searchQuery: SearchRevisionReqDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response
  ) {
    const file = await this.reviewsService.getRevisionListExcel(searchQuery, user);
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
    const { results, totalCount } = await this.reviewsService.getResultList(searchQuery);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, totalCount, results);
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
    summary: "전체 심사보고서 다운로드 API",
    description: "전체 심사보고서를 압축파일로 다운로드 할 수 있다.",
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("result/reports")
  async getResultReport(@Query() searchQuery: SearchResultReqDto, @Res({ passthrough: true }) res: Response) {
    const file = await this.reviewsService.getResultReport(searchQuery);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=" + file["filename"]);
    return new StreamableFile(file["file"]);
  }

  @ApiOperation({
    summary: "전체 심사현황 리스트 조회",
    description: "심사가 끝난 논문의 전체 심사 현황 리스트를 조회할 수 있다.",
  })
  @ApiPaginationOKResponse({
    description: "조회 성공",
    dto: GetReviewListResDto,
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("current")
  async getCurrentList(@Query() searchQuery: SearchCurrentReqDto) {
    const { results, totalCount } = await this.reviewsService.getCurrentList(searchQuery);
    const pageDto = new PageDto(searchQuery.pageNumber, searchQuery.pageSize, totalCount, results);
    return new CommonResponseDto(pageDto);
  }

  @ApiOperation({
    summary: "전체 심사현황 리스트 엑셀 다운로드 API",
    description: "전체 심사현황 리스트를 엑셀로 다운로드 할 수 있다.",
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("current/excel")
  async getCurrentExcel(@Query() searchQuery: SearchCurrentReqDto, @Res({ passthrough: true }) res: Response) {
    const file = await this.reviewsService.getCurrentListExcel(searchQuery);
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
  @ApiUnauthorizedResponse({ description: "학생 & 교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR, UserType.STUDENT])
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
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewFinalResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "학생 & 교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR, UserType.STUDENT])
  @Get("final/:id")
  async getReviewFinal(@Param("id", PositiveIntPipe) id: number, @CurrentUser() user: User) {
    const review = await this.reviewsService.getReviewFinal(id, user);
    return new CommonResponseDto(new GetReviewFinalResDto(review));
  }

  @ApiOperation({
    summary: "최종 논문 심사 정보 수정 API",
    description: "심사 정보를 수정할 수 있다.",
  })
  @ApiExtraModels(GetReviewFinalResDto)
  @ApiNoContentResponse({
    description: "수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetReviewFinalResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Put("final/:id")
  async updateReviewFinal(
    @Param("id", PositiveIntPipe) id: number,
    @Body() updateReviewFinalDto: UpdateReviewFinalReqDto,
    @CurrentUser() user: User
  ) {
    const review = await this.reviewsService.updateReviewFinal(id, updateReviewFinalDto, user);
    return new CommonResponseDto(new GetReviewFinalResDto(review));
  }

  @ApiOperation({
    summary: "수정 확인 논문 심사 정보 조회 API",
    description: "수정 확인이 필요한 논문 심사 정보를 조회할 수 있다.",
  })
  @ApiExtraModels(GetRevisionResDto)
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetRevisionResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "학생 & 교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR, UserType.STUDENT])
  @Get("revision/:id")
  async getRevision(@Param("id", PositiveIntPipe) id: number, @CurrentUser() user: User) {
    const review = await this.reviewsService.getRevision(id, user);
    return new CommonResponseDto(new GetRevisionResDto(review));
  }

  @ApiOperation({
    summary: "수정 확인 논문 심사 정보 수정 API",
    description: "수정 확인이 필요한 논문 심사 정보를 수정할 수 있다.",
  })
  @ApiExtraModels(GetReviewFinalResDto)
  @ApiNoContentResponse({
    description: "수정 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetRevisionResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "교수 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.PROFESSOR])
  @Put("revision/:id")
  async updateRevision(
    @Param("id", PositiveIntPipe) id: number,
    @Body() updateRevision: UpdateRevisionReqDto,
    @CurrentUser() user: User
  ) {
    const review = await this.reviewsService.updateRevision(id, updateRevision, user);
    return new CommonResponseDto(new GetRevisionResDto(review));
  }

  @ApiOperation({
    summary: "심사결과 정보 조회 API",
    description: "심사결과 정보를 조회할 수 있다.",
  })
  @ApiExtraModels(GetResultResDto)
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetResultResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("result/:id")
  async getResult(@Param("id", PositiveIntPipe) id: number) {
    const result = await this.reviewsService.getResult(id);
    return new CommonResponseDto(new GetResultResDto(result));
  }

  @ApiOperation({
    summary: "심사현행 정보 조회 API",
    description: "심사현행 정보를 조회할 수 있다.",
  })
  @ApiExtraModels(GetResultResDto)
  @ApiOkResponse({
    description: "조회 성공",
    schema: {
      allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(GetResultResDto) }],
    },
  })
  @ApiInternalServerErrorResponse({ description: "서버 오류" })
  @ApiUnauthorizedResponse({ description: "관리자 계정 로그인 후 이용 가능" })
  @UseUserTypeGuard([UserType.ADMIN])
  @Get("current/:id")
  async getCurrent(@Param("id", PositiveIntPipe) id: number) {
    const result = await this.reviewsService.getCurrent(id);
    return new CommonResponseDto(new GetResultResDto(result));
  }
}
