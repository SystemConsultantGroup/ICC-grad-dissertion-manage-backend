import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { UserType } from '@prisma/client';

export const UseUserTypeGuard = (types: UserType[]) => 
    applyDecorators(SetMetadata('types', types), UseGuards(UserTypeGuard));