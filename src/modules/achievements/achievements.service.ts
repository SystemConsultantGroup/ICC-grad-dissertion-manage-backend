import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../config/database/prisma.service";
import { CreateAchievementsDto } from "./dtos/create-achievements.dto";
import { UpdateAchievementsDto } from "./dtos/update-achievements.dto";
import { AchievementsSearchQuery } from "./dtos/achievements-query.dto";
import { User, UserType } from "@prisma/client";

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
}
