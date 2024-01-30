import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class UpdateRevisionReqDto {
  @ApiProperty({ description: "확인 여부", required: false })
  @IsOptional()
  @IsEnum(Status)
  contentStatus: Status;
}
