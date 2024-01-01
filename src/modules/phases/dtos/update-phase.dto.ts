import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty } from "class-validator";

export class UpdatePhaseDto {
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  start: Date;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  end: Date;
}
