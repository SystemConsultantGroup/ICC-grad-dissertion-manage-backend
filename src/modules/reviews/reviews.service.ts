import { Injectable, BadRequestException } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";
import { Stage, Status, Summary } from "@prisma/client";
import { GetReviewListResDto } from "./dtos/get-review-list.res.dto";
import { ReviewDto } from "./dtos/review.dto";
import { utils, write } from "xlsx";
import { UpdateReviewReqDto } from "./dtos/update-review.req.dto";
import { SearchReviewReqDto } from "./dtos/search-review.req.dto";
import { SearchResultReqDto } from "./dtos/search-result.req.dto";
import { GetResultListResDto } from "./dtos/get-result-list.res.dto";
import { ThesisInfoDto } from "./dtos/thesis-info.dto";
import { InternalServerErrorException } from "@nestjs/common/exceptions";
import { getCurrentTime } from "src/common/utils/date.util";

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  async buildFilename(base, searchQuery) {
    let queryString = "";
    if (searchQuery.author != undefined) queryString += "_저자_" + searchQuery.author;
    if (searchQuery.department != undefined) queryString += "_학과_" + searchQuery.department;
    if (searchQuery.stage != undefined) {
      if (searchQuery.stage == "PRELIMINARY") queryString += "_예심";
      if (searchQuery.stage == "MAIN") queryString += "_본심";
    }
    if (searchQuery.title != undefined) queryString += "_제목_" + searchQuery.title;
    if (searchQuery.status != undefined) {
      if (searchQuery.status == "FAIL" || searchQuery.status == "PASS") queryString += "_심사완료";
      if (searchQuery.status == "PENDING" || searchQuery.status == "UNEXAMINED") queryString += "_진행중";
    }
    if (searchQuery.summary != undefined) {
      if (searchQuery.status == "PASS") queryString += "_합격";
      if (searchQuery.status == "FAIL") queryString += "_불합격";
    }
    const dateString = getCurrentTime().fullDateTime;
    const fileName = encodeURIComponent(base + dateString + queryString + ".xlsx");
    return fileName;
  }

  async getReviewList(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    const reviews = await this.prismaService.review.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        reviewerId: id,
        isFinal: false,
        ...(searchQuery.author && {
          thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
        }),
        ...(searchQuery.department && {
          thesisInfo: { process: { student: { department: { name: { contains: searchQuery.department } } } } },
        }),
        ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
        ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
        ...(searchQuery.status && { status: searchQuery.status }),
      },
      include: {
        reviewer: true,
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                student: {
                  include: {
                    department: true,
                  },
                },
              },
            },
            thesisFiles: {
              include: {
                file: true,
              },
            },
          },
        },
      },
    });
    const totalCount = await this.prismaService.review.count({
      where: {
        reviewerId: id,
        isFinal: false,
        ...(searchQuery.author && {
          thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
        }),
        ...(searchQuery.department && {
          thesisInfo: { process: { student: { department: { name: { contains: searchQuery.department } } } } },
        }),
        ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
        ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
        ...(searchQuery.status && { status: searchQuery.status }),
      },
    });
    return {
      reviews: reviews.map((review) => new GetReviewListResDto(new ReviewDto(review))),
      totalCount: totalCount,
    };
  }
  async getReviewListExcel(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    const reviews = (
      await this.prismaService.review.findMany({
        where: {
          reviewerId: id,
          isFinal: false,
          ...(searchQuery.author && {
            thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
          }),
          ...(searchQuery.department && {
            thesisInfo: { process: { student: { department: { name: { contains: searchQuery.department } } } } },
          }),
          ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
          ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
          ...(searchQuery.status && { status: searchQuery.status }),
        },
        include: {
          reviewer: true,
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  student: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
              thesisFiles: {
                include: {
                  file: true,
                },
              },
            },
          },
        },
      })
    ).map((review) => new GetReviewListResDto(new ReviewDto(review)));

    const records = reviews.map((review) => {
      const record = {};
      record["저자"] = review.student;
      record["학과"] = review.department;
      if (review.stage == Stage.MAIN) record["구분"] = "본심";
      else if (review.stage == Stage.PRELIMINARY) record["구분"] = "예심";
      record["논문 제목"] = review.title;
      if (review.status == Status.PASS || review.status == Status.FAIL) record["심사 현황"] = "심사 완료";
      else if (review.status == Status.UNEXAMINED || review.status == Status.PENDING) record["심사 현황"] = "진행중";
      return record;
    });

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(records);
    utils.book_append_sheet(workbook, worksheet, "목록");

    return {
      filename: await this.buildFilename("심사_대상_논문_목록_", searchQuery),
      file: write(workbook, { type: "buffer", bookType: "xlsx" }),
    };
  }
  async getReview(id: number, user: User) {
    const userId = user.id;
    const review = await this.prismaService.review.findUnique({
      where: {
        id,
        isFinal: false,
      },
      include: {
        reviewer: true,
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                student: {
                  include: {
                    department: true,
                  },
                },
              },
            },
            thesisFiles: {
              include: {
                file: true,
              },
            },
          },
        },
      },
    });
    if (!review) throw new BadRequestException("존재하지 않는 심사 정보입니다.");
    return new ReviewDto(review);
  }
  async updateReview(id: number, updateReviewDto: UpdateReviewReqDto, user: User) {
    const foundReview = await this.prismaService.review.findUnique({
      where: {
        id,
        reviewerId: user.id,
        isFinal: false,
      },
    });
    if (!foundReview) throw new BadRequestException("존재하지 않는 심사정보입니다");
    try {
      const review = await this.prismaService.review.update({
        where: {
          id,
          reviewerId: user.id,
          isFinal: false,
        },
        data: {
          status: updateReviewDto.status,
          comment: updateReviewDto.comment,
          fileId: updateReviewDto.fileUUID,
        },
        include: {
          reviewer: true,
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  student: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
              thesisFiles: {
                include: {
                  file: true,
                },
              },
            },
          },
        },
      });
      return new ReviewDto(review);
    } catch (error) {
      throw new InternalServerErrorException("심사정보 수정 오류");
    }
  }

  async getReviewFinalList(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    const reviews = await this.prismaService.review.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        thesisInfo: {
          process: {
            headReviewerId: id,
          },
        },
        isFinal: true,
        ...(searchQuery.author && {
          thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
        }),
        ...(searchQuery.department && {
          thesisInfo: { process: { student: { department: { name: { contains: searchQuery.department } } } } },
        }),
        ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
        ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
        ...(searchQuery.status && { status: searchQuery.status }),
      },
      include: {
        reviewer: true,
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                student: {
                  include: {
                    department: true,
                  },
                },
              },
            },
            thesisFiles: {
              include: {
                file: true,
              },
            },
          },
        },
      },
    });
    const totalCount = await this.prismaService.review.count({
      where: {
        thesisInfo: {
          process: {
            headReviewerId: id,
          },
        },
        isFinal: true,
        ...(searchQuery.author && {
          thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
        }),
        ...(searchQuery.department && {
          thesisInfo: { process: { student: { department: { name: { contains: searchQuery.department } } } } },
        }),
        ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
        ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
        ...(searchQuery.status && { status: searchQuery.status }),
      },
    });
    return {
      reviews: reviews.map((review) => new GetReviewListResDto(new ReviewDto(review))),
      totalCount: totalCount,
    };
  }
  async getReviewListFinalExcel(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    const reviews = (
      await this.prismaService.review.findMany({
        where: {
          thesisInfo: {
            process: {
              headReviewerId: id,
            },
          },
          isFinal: true,
          ...(searchQuery.author && {
            thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
          }),
          ...(searchQuery.department && {
            thesisInfo: { process: { student: { department: { name: { contains: searchQuery.department } } } } },
          }),
          ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
          ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
          ...(searchQuery.status && { status: searchQuery.status }),
        },
        include: {
          reviewer: true,
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  student: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
              thesisFiles: {
                include: {
                  file: true,
                },
              },
            },
          },
        },
      })
    ).map((review) => new GetReviewListResDto(new ReviewDto(review)));
    const records = reviews.map((review) => {
      const record = {};
      record["저자"] = review.student;
      record["학과"] = review.department;
      if (review.stage == Stage.MAIN) record["구분"] = "본심";
      else if (review.stage == Stage.PRELIMINARY) record["구분"] = "예심";
      record["논문 제목"] = review.title;
      if (review.status == Status.PASS || review.status == Status.FAIL) record["심사 현황"] = "심사 완료";
      else if (review.status == Status.UNEXAMINED || review.status == Status.PENDING) record["심사 현황"] = "심사 대기";
      return record;
    });

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(records);
    utils.book_append_sheet(workbook, worksheet, "목록");

    return {
      filename: await this.buildFilename("최종_심사_대상_논문_목록_", searchQuery),
      file: write(workbook, { type: "buffer", bookType: "xlsx" }),
    };
  }
  async getReviewFinal(id: number, user: User) {
    const userId = user.id;
    const review = await this.prismaService.review.findUnique({
      where: {
        id,
        isFinal: true,
      },
      include: {
        reviewer: true,
        file: true,
        thesisInfo: {
          include: {
            reviews: {
              include: {
                file: true,
                reviewer: true,
              },
            },
            process: {
              include: {
                student: {
                  include: {
                    department: true,
                  },
                },
              },
            },
            thesisFiles: {
              include: {
                file: true,
              },
            },
          },
        },
      },
    });
    if (!review) throw new BadRequestException("존재하지 않는 심사 정보입니다.");
    return new ReviewDto(review);
  }
  async updateReviewFinal(id: number, updateReviewDto: UpdateReviewReqDto, user: User) {
    const foundReview = await this.prismaService.review.findUnique({
      where: {
        id,
        reviewerId: user.id,
        isFinal: true,
      },
    });
    if (!foundReview) throw new BadRequestException("존재하지 않는 심사정보입니다");
    try {
      const review = await this.prismaService.review.update({
        where: {
          id,
          reviewerId: user.id,
          isFinal: true,
        },
        data: {
          status: updateReviewDto.status,
          comment: updateReviewDto.comment,
          fileId: updateReviewDto.fileUUID,
        },
        include: {
          reviewer: true,
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  student: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
              thesisFiles: {
                include: {
                  file: true,
                },
              },
            },
          },
        },
      });
      return new ReviewDto(review);
    } catch (error) {
      throw new InternalServerErrorException("최종 심사정보 수정 오류");
    }
  }

  async getResultList(searchQuery: SearchResultReqDto) {
    const results = await this.prismaService.thesisInfo.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        ...(searchQuery.author && { process: { student: { name: { contains: searchQuery.author } } } }),
        ...(searchQuery.department && {
          process: { student: { department: { name: { contains: searchQuery.department } } } },
        }),
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        ...(searchQuery.summary && { summary: searchQuery.summary }),
        NOT: {
          summary: Summary.UNEXAMINED,
        },
      },
      include: {
        process: {
          include: {
            student: {
              include: {
                department: true,
              },
            },
          },
        },
        thesisFiles: {
          include: {
            file: true,
          },
        },
      },
    });
    const totalCount = await this.prismaService.thesisInfo.count({
      where: {
        ...(searchQuery.author && { process: { student: { name: { contains: searchQuery.author } } } }),
        ...(searchQuery.department && {
          process: { student: { department: { name: { contains: searchQuery.department } } } },
        }),
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        ...(searchQuery.summary && { summary: searchQuery.summary }),
        NOT: {
          summary: Summary.UNEXAMINED,
        },
      },
    });
    return {
      results: results.map((result) => new GetResultListResDto(new ThesisInfoDto(result))),
      totalCount: totalCount,
    };
  }
  async getResultExcel(searchQuery: SearchResultReqDto) {
    const results = (
      await this.prismaService.thesisInfo.findMany({
        where: {
          ...(searchQuery.author && { process: { student: { name: { contains: searchQuery.author } } } }),
          ...(searchQuery.department && {
            process: { student: { department: { name: { contains: searchQuery.department } } } },
          }),
          ...(searchQuery.stage && { stage: searchQuery.stage }),
          ...(searchQuery.title && { title: { contains: searchQuery.title } }),
          ...(searchQuery.summary && { summary: searchQuery.summary }),
          NOT: {
            summary: Summary.UNEXAMINED,
          },
        },
        include: {
          process: {
            include: {
              student: {
                include: {
                  department: true,
                },
              },
            },
          },
          thesisFiles: {
            include: {
              file: true,
            },
          },
        },
      })
    ).map((result) => new GetResultListResDto(new ThesisInfoDto(result)));
    const records = results.map((result) => {
      const record = {};
      record["저자"] = result.student;
      record["학과"] = result.department;
      if (result.stage == Stage.MAIN) record["구분"] = "본심";
      else if (result.stage == Stage.PRELIMINARY) record["구분"] = "예심";
      record["논문 제목"] = result.title;
      if (result.summary == Summary.PASS) record["심사 결과"] = "합격";
      else if (result.summary == Summary.FAIL) record["심사 결과"] = "불합격";
      return record;
    });

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(records);
    utils.book_append_sheet(workbook, worksheet, "목록");

    return {
      filename: await this.buildFilename("전체_심사_결과_목록_", searchQuery),
      file: write(workbook, { type: "buffer", bookType: "xlsx" }),
    };
  }
}
