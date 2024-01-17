import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { CreateAchievementsDto } from "./dtos/create-achievements.dto";
import { UpdateAchievementsDto } from "./dtos/update-achievements.dto";
import { AchievementsExcelQuery, AchievementsSearchQuery } from "./dtos/achievements-query.dto";
import { User, UserType } from "@prisma/client";
import * as XLSX from "xlsx";
import * as DateUtil from "../../common/utils/date.util";
import { Readable } from "stream";
@Injectable()
export class AchievementsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAchievement(userId: number, createAchievementsDto: CreateAchievementsDto) {
    const { performance, paperTitle, journalName, ISSN, publicationDate, authorType, authorNumbers } =
      createAchievementsDto;
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new BadRequestException("올바르지 않은 유저id입니다.");
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

  async updateAchievement(id: number, updateAchievementDto: UpdateAchievementsDto) {
    const foundUser = await this.prismaService.achievements.findFirst({
      where: {
        id,
      },
    });
    if (!foundUser) throw new BadRequestException("해당 논문실적은 존재하지 않습니다.");
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
    if (currentUser.type == UserType.STUDENT) {
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

    const { major, author, paperTitle, performance, journalName, publicationDate } = achievementsQuery;

    const query = {
      where: {
        ...(major && { User: { department: { name: { contains: major } } } }),
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
    const { major, author, paperTitle, performance, journalName, publicationDate } = achievementsQuery;

    const achievements = await this.prismaService.achievements.findMany({
      where: {
        ...(major && { User: { department: { name: { contains: major } } } }),
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

      record["실적 구분"] = achievement.performance;
      record["학술지 또는 학술대회명"] = achievement.journalName;
      record["논문 제목"] = achievement.paperTitle;
      (record["ISSN"] = achievement.ISSN ? achievement.ISSN : "미제출"),
        (record["게재년월일"] = achievement.publicationDate);
      record["주저자여부"] = achievement.authorType;
      record["저자수"] = achievement.userId;

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
}
