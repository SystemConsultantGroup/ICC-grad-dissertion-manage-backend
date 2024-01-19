import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class UpdateRevisionReqDto {
  @ApiProperty({ description: "확인 여부", required: false })
  @IsOptional()
  @IsEnum(Status)
  contentStatus: Status;

  @ApiProperty({ description: "심사 의견 파일 UUID", required: false })
  @IsOptional()
  @IsUUID()
  fileUUID: string;
}
