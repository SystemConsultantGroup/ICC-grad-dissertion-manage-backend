import { ApiProperty } from "@nestjs/swagger";
import { Department, Process, User } from "@prisma/client";
import { UserDto } from "src/modules/users/dtos/user.dto";

export class ProcessDto {
  constructor(
    process: Process & {
      student: User & { department: Department };
    }
  ) {
    this.student = process.student;
  }

  @ApiProperty({ description: "논문저자", type: () => UserDto })
  student: UserDto;
}
