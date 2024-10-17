import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { CreateAchievementsDto } from "./dtos/create-achievements.dto";
import { UpdateAchievementsDto } from "./dtos/update-achievements.dto";
import { AchievementsExcelQuery, AchievementsSearchQuery } from "./dtos/achievements-query.dto";
import { AuthorType, Performance, User, UserType } from "@prisma/client";
import * as XLSX from "xlsx";
import * as DateUtil from "../../common/utils/date.util";
import { Readable } from "stream";
@Injectable()
export class AchievementsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAchievement(userId: number, user: User, createAchievementsDto: CreateAchievementsDto) {
    const { performance, paperTitle, journalName, ISSN, publicationDate, authorType, authorNumbers } =
      createAchievementsDto;

    if ((user.type === UserType.STUDENT || user.type === UserType.PHD) && userId !== user.id)
      throw new UnauthorizedException("본인 논문실적만 등록 가능합니다.");
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!foundUser) throw new BadRequestException("해당 유저가 존재하지 않습니다.");
    return await this.prismaService.achievements.create({
      data: {
        userId,
        performance,
        paperTitle,
        journalName,
        ISSN,
        publicationDate,
        authorNumbers,
        authorType,
      },
    });
  }

  async updateAchievement(id: number, user: User, updateAchievementDto: UpdateAchievementsDto) {
    const foundUser = await this.prismaService.achievements.findFirst({
      where: {
        id,
      },
    });
    if (!foundUser) throw new BadRequestException("해당 논문실적은 존재하지 않습니다.");
    if ((user.type === UserType.STUDENT || user.type === UserType.PHD) && foundUser.userId != user.id)
      throw new BadRequestException("다른 학생의 논문실적은 수정할수 없습니다.");
    const { performance, paperTitle, journalName, ISSN, publicationDate, authorType, authorNumbers } =
      updateAchievementDto;
    try {
      return await this.prismaService.achievements.update({
        where: {
          id,
        },
        data: {
          ...(performance && { performance }),
          ...(paperTitle && { paperTitle }),
          ...(journalName && { journalName }),
          ...(ISSN && { ISSN }),
          ...(publicationDate && { publicationDate }),
          ...(authorType && { authorType }),
          ...(authorNumbers && { authorNumbers }),
        },
      });
    } catch {
      throw new InternalServerErrorException("논문 실적 업데이트에 실패했습니다.");
    }
  }

  async getAchievements(currentUser: User, achievementsQuery: AchievementsSearchQuery) {
    if (currentUser.type === UserType.STUDENT || currentUser.type === UserType.PHD) {
      const studentQuery = {
        where: {
          userId: currentUser.id,
        },
        include: {
          User: {
            include: {
              department: true,
            },
          },
        },
        skip: achievementsQuery.getOffset(),
        take: achievementsQuery.getLimit(),
      };

      try {
        const [achievements, counts] = await this.prismaService.$transaction([
          this.prismaService.achievements.findMany(studentQuery),
          this.prismaService.achievements.count({ where: studentQuery.where }),
        ]);
        return { achievements, counts };
      } catch (e) {
        throw new InternalServerErrorException(e);
      }
    }

    const { departmentId, author, paperTitle, performance, journalName, publicationDate } = achievementsQuery;

    const query = {
      where: {
        ...(departmentId && { User: { department: { id: { equals: departmentId } } } }),
        ...(author && { User: { name: { contains: author } } }),
        ...(paperTitle && { paperTitle: { contains: paperTitle } }),
        ...(performance && { performance: { equals: performance } }),
        ...(journalName && { journalName: { contains: journalName } }),
        ...(publicationDate && { publicationDate: { equals: publicationDate } }),
      },
      include: {
        User: {
          include: {
            department: true,
          },
        },
      },

      skip: achievementsQuery.getOffset(),
      take: achievementsQuery.getLimit(),
    };
    try {
      const [achievements, counts] = await this.prismaService.$transaction([
        this.prismaService.achievements.findMany(query),
        this.prismaService.achievements.count({ where: query.where }),
      ]);
      return { achievements, counts };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async getAchievementsExcel(achievementsQuery: AchievementsExcelQuery) {
    const { departmentId, author, paperTitle, performance, journalName, publicationDate } = achievementsQuery;

    const achievements = await this.prismaService.achievements.findMany({
      where: {
        ...(departmentId && { User: { department: { departmentId: { equals: departmentId } } } }),
        ...(author && { User: { name: { contains: author } } }),
        ...(paperTitle && { paperTitle: { contains: paperTitle } }),
        ...(performance && { performance: { equals: performance } }),
        ...(journalName && { journalName: { contains: journalName } }),
        ...(publicationDate && { publicationDate: { equals: publicationDate } }),
      },
      include: {
        User: {
          include: {
            department: true,
          },
        },
      },
    });
    if (!achievements) throw new BadRequestException("검색된 논문 실적이 없습니다.");
    const records = achievements.map((achievement) => {
      const record = {};
      const student = achievement.User;
      const dept = achievement.User.department;

      record["학번"] = student.loginId;
      record["이름"] = student.name;
      record["학과"] = dept.name;

      record["실적 구분"] = this.PerformanceToFullname(achievement.performance);
      record["학술지 또는 학술대회명"] = achievement.journalName;
      record["논문 제목"] = achievement.paperTitle;
      (record["ISSN"] = achievement.ISSN ? achievement.ISSN : "미제출"),
        (record["게재년월일"] = achievement.publicationDate);
      record["주저자여부"] = this.authorToFullname(achievement.authorType);
      record["저자수"] = achievement.authorNumbers;

      return record;
    });

    const workSheet = XLSX.utils.json_to_sheet(records);
    const workBook = XLSX.utils.book_new();
    const fileName = "논문실적리스트_" + DateUtil.getCurrentTime().fullDateTime + ".xlsx";
    XLSX.utils.book_append_sheet(workBook, workSheet, "논문실적 목록");

    const stream = new Readable();
    stream.push(await XLSX.write(workBook, { type: "buffer" }));
    stream.push(null);

    return { fileName, stream };
  }

  PerformanceToFullname(alias: Performance) {
    switch (alias) {
      case Performance.SCI:
        return "SCI";
      case Performance.SCOPUS:
        return "SCOPUS";
      case Performance.SCIE:
        return "SCI(E)급 국제학회";
      case Performance.INTERNATIONAL_B:
        return "국제 B급 학술지";
      case Performance.DOMESTIC_A:
        return "국내 A급 학술지";
      case Performance.DOMESTIC_B:
        return "국내 B급 학술지";
      case Performance.ICOP:
        return "국제 학술대회 구두발표";
      case Performance.ICP:
        return "국제 학술대회 포스터";
      case Performance.DCOP:
        return "국내 학술대회 구두발표";
      case Performance.DCP:
        return "국내 학술대회 포스터";
      case Performance.IPR:
        return "국제특허등록";
      case Performance.IPA:
        return "국제특허출원";
      case Performance.DPR:
        return "국내특허등록";
      case Performance.DPA:
        return "국내특허출원";
    }
  }
  authorToFullname(author: AuthorType) {
    switch (author) {
      case AuthorType.FIRST_AUTHOR:
        return "제1저자";
      case AuthorType.CO_FIRST_AUTHOR:
        return "공동1저자";
      case AuthorType.CORRESPONDING_AUTHOR:
        return "교신저자";
      case AuthorType.FIRST_CORRESPONDING_AUTHOR:
        return "제1교신저자";
      case AuthorType.CO_AUTHOR:
        return "공저자";
    }
  }

  async getAchievement(id: number, user: User) {
    const achievement = await this.prismaService.achievements.findFirst({
      where: {
        id,
      },
    });
    if (!achievement) throw new BadRequestException("해당 id의 논문실적이 존재하지 않습니다.");
    if ((user.type === UserType.STUDENT || user.type === UserType.PHD) && achievement.userId !== user.id)
      throw new UnauthorizedException("학생의 경우 본인 논문 실적만 조회가 가능합니다.");
    return achievement;
  }

  async deleteAchievement(id: number, user: User) {
    const achievement = await this.prismaService.achievements.findFirst({
      where: {
        id,
      },
    });
    if (!achievement) throw new BadRequestException("해당 id의 논문실적이 존재하지 않습니다.");
    if ((user.type === UserType.STUDENT || user.type === UserType.PHD) && achievement.userId !== user.id)
      throw new UnauthorizedException("학생의 경우 본인 논문 실적만 조회가 가능합니다.");
    try {
      await this.prismaService.achievements.delete({
        where: {
          id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
