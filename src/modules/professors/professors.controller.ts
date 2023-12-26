import { Controller } from "@nestjs/common";
import { ProfessorsService } from "./professors.service";

@Controller("professors")
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}
}
