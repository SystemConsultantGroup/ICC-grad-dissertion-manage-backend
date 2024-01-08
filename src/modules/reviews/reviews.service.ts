import { Injectable, BadRequestException } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";
import { GetReviewListResDto } from "./dtos/get-review-list.res.dto";
import { ReviewDto } from "./dtos/review.dto";
import { utils, write } from "xlsx";
import { UpdateReviewReqDto } from "./dtos/update-review.req.dto";
import { SearchReviewReqDto } from "./dtos/search-review.req.dto";
import { SearchResultReqDto } from "./dtos/search-result.req.dto";
import { GetResultListResDto } from "./dtos/get-result-list.res.dto";
import { ThesisInfoDto } from "./dtos/thesis-info.dto";
import { InternalServerErrorException } from "@nestjs/common/exceptions";

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

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
    return reviews.map((review) => new GetReviewListResDto(new ReviewDto(review)));
  }
  async getReviewListExcel(user: User) {
    const { id } = user;
    const reviews = (
      await this.prismaService.review.findMany({
        where: {
          reviewerId: id,
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
      })
    ).map((review) => new GetReviewListResDto(new ReviewDto(review)));
    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(reviews);
    utils.book_append_sheet(workbook, worksheet, "목록");
    return write(workbook, { type: "buffer", bookType: "xlsx" });
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
    return reviews.map((review) => new GetReviewListResDto(new ReviewDto(review)));
  }
  async getReviewListFinalExcel(user: User) {
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
    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(reviews);
    utils.book_append_sheet(workbook, worksheet, "목록");
    return write(workbook, { type: "buffer", bookType: "xlsx" });
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
    return results.map((result) => new GetResultListResDto(new ThesisInfoDto(result)));
  }
  async getResultExcel() {
    const results = (
      await this.prismaService.thesisInfo.findMany({
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
    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(results);
    utils.book_append_sheet(workbook, worksheet, "목록");
    return write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}
