import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { UserType } from "@prisma/client";
import { UserTypeGuard } from "../guards/user-type-guard";

export const UseUserTypeGuard = (types: UserType[]) =>
  applyDecorators(SetMetadata("types", types), UseGuards(UserTypeGuard));
