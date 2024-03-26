import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class UpdateSystemDto {
  // 심사 위원 정보
  @ApiProperty({ description: "심사위원장 아이디", example: "2" })
  @IsNotEmpty()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  headReviewerId: number;

  @ApiProperty({ description: "지도교수 아이디 리스트", type: [Number], example: "[3, 4]" })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  advisorIds: number[];

  @ApiProperty({ description: "심사위원 아이디 리스트", type: [Number], example: "[10, 11]" })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  committeeIds: number[];

  // 논문 정보
  @ApiProperty({ description: "논문 제목", example: "논문 제목 예시", required: false })
  @IsOptional()
  @IsString()
  thesisTitle: string;
}
