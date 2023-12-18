import { CanActivate, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class UserTypeGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prismaService: PrismaService
    )
}