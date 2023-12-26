import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/config/database/prisma.service";

@Injectable()
export class ProfessorsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfessorsList() {}

  async getProfessor(id: number) {}

  async createProfessor() {}

  async updateProfessor(id: number) {}

  async uploadProfessorExcel() {}

  async downloadProfessorExcel() {}
}
