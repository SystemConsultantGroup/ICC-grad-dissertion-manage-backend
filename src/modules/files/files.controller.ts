import { Controller, Post, UseGuards } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtGuard } from "../auth/guards/jwt.guard";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(JwtGuard)
  @Post()
  async uploadFile() {}
}
