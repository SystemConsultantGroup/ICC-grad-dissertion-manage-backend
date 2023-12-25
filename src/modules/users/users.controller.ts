import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { UseUserTypeGuard } from "../auth/decorators/user-type-guard.decorator";
import { User, UserType } from "@prisma/client";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { CommonResponseDto } from "src/common/dtos/common-response.dto";
import { UserDto } from "./dtos/user.dto";

@Controller("users")
@UseGuards(JwtGuard)
@ApiTags("유저 API")
@ApiBearerAuth("access-token")
@ApiInternalServerErrorResponse({ description: "서버 내부 오류" })
@ApiExtraModels(CommonResponseDto, UserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/me")
  @UseUserTypeGuard([UserType.ADMIN, UserType.STUDENT, UserType.PROFESSOR])
  @ApiOperation({ summary: "로그인 유저 정보 조회 API", description: "로그인된 유저의 회원 정보를 조회할 수 있다." })
  @ApiOkResponse({
    description: "조회 성공",
    schema: { allOf: [{ $ref: getSchemaPath(CommonResponseDto) }, { $ref: getSchemaPath(UserDto) }] },
  })
  @ApiUnauthorizedResponse({ description: "로그인 후 이용 가능" })
  async getMe(@CurrentUser() currentUser: User) {
    const me = await this.usersService.getMe(currentUser);
    const userDto = new UserDto(me);
    return new CommonResponseDto(userDto);
  }

  @Post("/admin")
  async updateAdmin() {
    return "post admin";
  }
}
