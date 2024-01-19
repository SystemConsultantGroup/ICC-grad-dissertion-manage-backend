import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateReviewFinalReqDto {
  @ApiProperty({ description: "내용 합격 여부", required: false })
  @IsOptional()
  @IsEnum(Status)
  contentStatus: Status;

  @ApiProperty({ description: "심사 의견", required: false })
  @IsOptional()
  @IsString()
  comment: string;

  @ApiProperty({ description: "심사 의견 파일 UUID", required: false })
  @IsOptional()
  @IsUUID()
  fileUUID: string;
}
