import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateReviewReqDto {
  @ApiProperty({ description: "합격 여부" })
  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ description: "심사 의견" })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({ description: "심사 의견 파일 UUID" })
  @IsOptional()
  @IsString()
  fileUUID: string;
}
