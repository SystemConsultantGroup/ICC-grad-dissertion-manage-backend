import { PartialType } from "@nestjs/swagger";
import { CreateProfessorDto } from "./create-professor.dto";

export class UpdateProfessorDto extends PartialType(CreateProfessorDto) {}
