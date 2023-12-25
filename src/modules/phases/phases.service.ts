import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";

@Injectable()
export class PhasesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPhaseList() {
    return await this.prismaService.phase.findMany();
  }
}
