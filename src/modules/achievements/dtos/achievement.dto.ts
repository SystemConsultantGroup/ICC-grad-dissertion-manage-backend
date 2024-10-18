import { ApiProperty } from "@nestjs/swagger";
import { Achievements, AuthorType, Department, Performance, User } from "@prisma/client";

export class AchievementDto {
  constructor(achievement: Achievements & { User: User & { department: Department } }) {
    this.id = achievement.id;
    this.performance = achievement.performance;
    this.journalName = achievement.journalName;
    this.paperTitle = achievement.paperTitle;
    if (achievement.ISSN) this.ISSN = achievement.ISSN;
    this.publicationDate = achievement.publicationDate;
    this.authorType = achievement.authorType;
    this.authorNumbers = achievement.authorNumbers;
    this.name = achievement.User.name;
    this.department = achievement.User.department.name;
    this.professorId1 = achievement.professorId1;
    this.professorId2 = achievement.professorId2;
  }
  @ApiProperty({ description: "논문실적 id" })
  id: number;

  @ApiProperty({ description: "실적 구분" })
  performance: Performance;

  @ApiProperty({ description: "학술지명" })
  journalName: string;

  @ApiProperty({ description: "논문 제목" })
  paperTitle: string;

  @ApiProperty({ description: "ISSN", required: false })
  ISSN?: string;

  @ApiProperty({ description: "게재년월일" })
  publicationDate: Date;

  @ApiProperty({ description: "주저자 여부" })
  authorType: AuthorType;

  @ApiProperty({ description: "주저자 수" })
  authorNumbers: number;

  @ApiProperty({ description: "이름" })
  name?: string;

  @ApiProperty({ description: "학과" })
  department?: string;

  @ApiProperty({ description: "지도교수1" })
  professorId1: number;

  @ApiProperty({ description: "지도교수2" })
  professorId2: number;
}

export class CreateAchievementResponseDto {
  constructor(achievement: Achievements) {
    this.id = achievement.id;
    this.performance = achievement.performance;
    this.journalName = achievement.journalName;
    this.paperTitle = achievement.paperTitle;
    if (achievement.ISSN) this.ISSN = achievement.ISSN;
    this.publicationDate = achievement.publicationDate;
    this.authorType = achievement.authorType;
    this.authorNumbers = achievement.authorNumbers;
    this.userId = achievement.userId;
    this.professorId1 = achievement.professorId1;
    this.professorId2 = achievement.professorId2;
  }
  @ApiProperty({ description: "논문실적 id" })
  id: number;

  @ApiProperty({ description: "실적 구분" })
  performance: Performance;

  @ApiProperty({ description: "학술지명" })
  journalName: string;

  @ApiProperty({ description: "논문 제목" })
  paperTitle: string;

  @ApiProperty({ description: "ISSN" })
  ISSN?: string;

  @ApiProperty({ description: "게재년월일" })
  publicationDate: Date;

  @ApiProperty({ description: "주저자 여부" })
  authorType: AuthorType;

  @ApiProperty({ description: "주저자 수" })
  authorNumbers: number;

  @ApiProperty({ description: "유저ID" })
  userId: number;

  @ApiProperty({ description: "지도교수1" })
  professorId1: number;

  @ApiProperty({ description: "지도교수2" })
  professorId2: number;
}
