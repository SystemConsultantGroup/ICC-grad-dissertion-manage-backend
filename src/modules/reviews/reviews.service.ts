import { BadRequestException, Injectable } from "@nestjs/common";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common/exceptions";
import { Role, Stage, Status, Summary, User, UserType } from "@prisma/client";
import { readFile } from "fs";
import * as Zip from "jszip";
import * as path from "path";
import { getCurrentTime } from "src/common/utils/date.util";
import { readableToBuffer } from "src/common/utils/readable-to-buf";
import { PrismaService } from "src/config/database/prisma.service";
import { MinioClientService } from "src/config/file/minio-client.service";
import { v1 } from "uuid";
import { utils, write } from "xlsx";
import { GetCurrentListResDto } from "./dtos/get-current-list.res.dto";
import { GetResultListResDto } from "./dtos/get-result-list.res.dto";
import { GetResultResDto } from "./dtos/get-result.res.dto";
import { GetReviewFinalListResDto } from "./dtos/get-review-final-list.res.dto";
import { GetReviewListResDto } from "./dtos/get-review-list.res.dto";
import { GetRevisionListResDto } from "./dtos/get-revision-list.res.dto";
import { ReviewDto } from "./dtos/review.dto";
import { SearchCurrentReqDto } from "./dtos/search-current.req.dto";
import { SearchResultReqDto } from "./dtos/search-result.req.dto";
import { SearchReviewReqDto, SearchStatus } from "./dtos/search-review.req.dto";
import { SearchRevisionReqDto } from "./dtos/search-revision.req.dto";
import { ThesisInfoDto } from "./dtos/thesis-info.dto";
import { UpdateReviewFinalReqDto } from "./dtos/update-review-final.req.dto";
import { UpdateReviewReqDto } from "./dtos/update-review.req.dto";
import { UpdateRevisionReqDto } from "./dtos/update-revision.req.dto";
// import { convertHTMLToPDF } from "src/common/utils/convert-html-to-pdf";
import { KafkaProducer } from "../../config/kafka/kafka.service";
import { ProcessDto } from "./dtos/process.dto";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly minioClientService: MinioClientService,
    private readonly prismaService: PrismaService,
    private readonly kafkaProducer: KafkaProducer
  ) {}

  buildFilename(base, searchQuery, isRevision = false) {
    let queryString = "";
    if (searchQuery.author != undefined) queryString += "_저자_" + searchQuery.author;
    if (searchQuery.department != undefined) queryString += "_학과_" + searchQuery.department;
    if (searchQuery.stage != undefined) {
      if (searchQuery.stage == "PRELIMINARY") queryString += "_예심";
      if (searchQuery.stage == "MAIN") queryString += "_본심";
    }
    if (searchQuery.title != undefined) queryString += "_제목_" + searchQuery.title;
    if (!isRevision) {
      if (searchQuery.status != undefined) {
        if (searchQuery.status == "FAIL" || searchQuery.status == "PASS") queryString += "_심사완료";
        if (searchQuery.status == "PENDING" || searchQuery.status == "UNEXAMINED") queryString += "_진행중";
      }
    } else {
      if (searchQuery.status != undefined) {
        if (searchQuery.status == "PASS") queryString += "_확인완료";
        if (searchQuery.status == "UNEXAMINED") queryString += "_미확인";
      }
    }
    if (searchQuery.summary != undefined) {
      if (searchQuery.status == "PASS") queryString += "_합격";
      if (searchQuery.status == "FAIL") queryString += "_불합격";
    }
    const dateString = getCurrentTime().fullDateTime;
    const fileName = encodeURIComponent(base + dateString + queryString + ".xlsx");
    return fileName;
  }

  async buildResultPdf(reviewId, replacer, isMain, studentName: string) {
    const fileName = (isMain ? "" : "예비") + "심사결과보고서_양식.html";
    const filePath = path.join("resources", "format", fileName);
    try {
      return new Promise((resolve) => {
        readFile(filePath, "utf8", async (err, formatHtml) => {
          if (err) throw new InternalServerErrorException("reading format html file failed: " + filePath);
          const replacerKeys = Object.keys(replacer);
          if (isMain) {
            for (const key of replacerKeys) {
              if (key == "$심사위원장") {
                for (const slot of replacer[key]) {
                  formatHtml = formatHtml.replace(
                    "$row",
                    `
                  <tr class="row_1">
                    <td class="label_1">
                        <span>심사위원장</span><br>
                        Committee Chair
                    </td>
                    <td>
                        $성명
                    </td>
                    <td>
                        $내용:합격
                    </td>
                    <td>
                        $내용:불합격
                    </td>
                    <td>
                        $구두:합격
                    </td>
                    <td>
                        $구두:불합격
                    </td>
                  </tr>
                `
                  );
                  for (const key of Object.keys(slot)) formatHtml = formatHtml.replace(key, slot[key]);
                }
              } else if (key == "$심사위원") {
                for (const slot of replacer[key]) {
                  formatHtml = formatHtml.replace(
                    "$row",
                    `
                    <tr class="row_1">
                      <td class="label_1">
                          <span>심사위원</span><br>
                          Committee Member
                      </td>
                      <td>
                          $성명
                      </td>
                      <td>
                          $내용:합격
                      </td>
                      <td>
                          $내용:불합격
                      </td>
                      <td>
                          $구두:합격
                      </td>
                      <td>
                          $구두:불합격
                      </td>
                  </tr>
                `
                  );
                  for (const key of Object.keys(slot)) formatHtml = formatHtml.replace(key, slot[key]);
                }
              } else if (key == "$지도교수") {
                for (const slot of replacer[key]) {
                  formatHtml = formatHtml.replace(
                    "$row",
                    `
                    <tr class="row_1">
                      <td class="label_1">
                          <span>지도교수</span><br>
                          Advisor
                      </td>
                      <td>
                          $성명
                      </td>
                      <td>
                          $내용:합격
                      </td>
                      <td>
                          $내용:불합격
                      </td>
                      <td>
                          $구두:합격
                      </td>
                      <td>
                          $구두:불합격
                      </td>
                  </tr>
                `
                  );
                  for (const key of Object.keys(slot)) formatHtml = formatHtml.replace(key, slot[key]);
                }
              } else if (key == "$서명") {
                if (replacer[key]) {
                  const readable = await this.minioClientService.getFile(replacer[key]);
                  const buf = await readableToBuffer(readable);
                  formatHtml = formatHtml.replace(key, `data:image/png;base64, ${buf.toString("base64")}`);
                } else {
                  formatHtml = formatHtml.replace(key, "");
                }
              } else {
                formatHtml = formatHtml.replace(key, replacer[key]);
              }
            }
          } else {
            for (const key of replacerKeys) {
              if (key == "$심사위원장") {
                for (const slot of replacer[key]) {
                  formatHtml = formatHtml.replace(
                    "$row",
                    `
                  <tr class="row_1">
                    <td class="label_1">
                        <span>심사위원장</span><br>
                        Committee Chair
                    </td>
                    <td>
                        $성명
                    </td>
                    <td>
                        $합격
                    </td>
                    <td>
                        $불합격
                    </td>
                  </tr>
                `
                  );
                  for (const key of Object.keys(slot)) formatHtml = formatHtml.replace(key, slot[key]);
                }
              } else if (key == "$심사위원") {
                for (const slot of replacer[key]) {
                  formatHtml = formatHtml.replace(
                    "$row",
                    `
                    <tr class="row_1">
                      <td class="label_1">
                          <span>심사위원</span><br>
                          Committee Member
                      </td>
                      <td>
                          $성명
                      </td>
                      <td>
                          $합격
                      </td>
                      <td>
                          $불합격
                      </td>
                  </tr>
                `
                  );
                  for (const key of Object.keys(slot)) formatHtml = formatHtml.replace(key, slot[key]);
                }
              } else if (key == "$지도교수") {
                for (const slot of replacer[key]) {
                  formatHtml = formatHtml.replace(
                    "$row",
                    `
                    <tr class="row_1">
                      <td class="label_1">
                          <span>지도교수</span><br>
                          Advisor
                      </td>
                      <td>
                          $성명
                      </td>
                      <td>
                          $합격
                      </td>
                      <td>
                          $불합격
                      </td>
                  </tr>
                `
                  );
                  for (const key of Object.keys(slot)) formatHtml = formatHtml.replace(key, slot[key]);
                }
              } else if (key == "$서명") {
                if (replacer[key]) {
                  const readable = await this.minioClientService.getFile(replacer[key]);
                  const buf = await readableToBuffer(readable);
                  formatHtml = formatHtml.replace(key, `data:image/png;base64, ${buf.toString("base64")}`);
                } else {
                  formatHtml = formatHtml.replace(key, "");
                }
              } else {
                formatHtml = formatHtml.replace(key, replacer[key]);
              }
            }
            formatHtml = formatHtml.replaceAll("$row", "");
          }

          for (let i = 0; i < 2; i++) formatHtml = formatHtml.replaceAll("$row", "");

          const key = v1();
          const createdAt = new Date();
          await this.kafkaProducer.sendMessage("pdf-topic-dev", JSON.stringify(reviewId), formatHtml, {
            originalName: studentName + "_" + fileName.replace("_양식.html", ".pdf"),
            uuid: key,
          });
          // await convertHTMLToPDF(formatHtml, async (pdf) => {
          //   if (err) throw new InternalServerErrorException("Creating PDF Buffer failed!");
          //   await this.minioClientService.uploadFile(
          //     key,
          //     pdf,
          //     Buffer.byteLength(pdf),
          //     createdAt,
          //     reviewId.toString() + "_" + fileName.replace(".html", ".pdf"),
          //     "application/pdf"
          //   );
          // });
          return resolve(
            await this.prismaService.file.create({
              data: {
                name: studentName + "_" + fileName.replace("_양식.html", ".pdf"),
                mimeType: "application/pdf",
                uuid: key,
                createdAt: createdAt,
              },
            })
          );
        });
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("파일 생성 오류");
    }
  }

  async buildReportPdf(reviewId, replacer, isMain, studentName: string, professorName: string) {
    const fileName = (isMain ? "" : "예비") + "심사보고서_양식.html";
    const filePath = path.join("resources", "format", fileName);
    try {
      return new Promise((resolve) => {
        readFile(filePath, "utf8", async (err, formatHtml) => {
          if (err) throw new InternalServerErrorException("reading format html file failed: " + filePath);
          const replacerKeys = Object.keys(replacer);
          for (const key of replacerKeys) {
            if (key == "$서명") {
              if (replacer[key]) {
                const readable = await this.minioClientService.getFile(replacer[key]);
                const buf = await readableToBuffer(readable);
                formatHtml = formatHtml.replace(key, `data:image/png;base64, ${buf.toString("base64")}`);
              } else {
                formatHtml = formatHtml.replace(key, "");
              }
            } else {
              formatHtml = formatHtml.replaceAll(key, replacer[key]);
            }
          }

          const key = v1();
          const createdAt = new Date();
          // await convertHTMLToPDF(formatHtml, async (pdf) => {
          //   if (err) throw new InternalServerErrorException("Creating PDF Buffer failed!");
          //   await this.minioClientService.uploadFile(
          //     key,
          //     pdf,
          //     Buffer.byteLength(pdf),
          //     createdAt,
          //     reviewId.toString() + "_" + fileName.replace(".html", ".pdf"),
          //     "application/pdf"
          //   );
          // });
          await this.kafkaProducer.sendMessage("pdf-topic-dev", JSON.stringify(reviewId), formatHtml, {
            originalName: studentName + "_" + professorName + "_" + fileName.replace("_양식.html", ".pdf"),
            uuid: key,
          });

          return resolve(
            await this.prismaService.file.create({
              data: {
                name: studentName + "_" + professorName + "_" + fileName.replace("_양식.html", ".pdf"),
                mimeType: "application/pdf",
                uuid: key,
                createdAt: createdAt,
              },
            })
          );
        });
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("파일 생성 오류");
    }
  }

  async getReviewMe(user: User) {
    const { id } = user;
    const thesisInfos = await this.prismaService.thesisInfo.findMany({
      where: {
        process: {
          studentId: id,
        },
      },
      include: {
        process: {
          include: {
            reviewers: true,
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
        reviews: {
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            file: true,
          },
        },
      },
    });
    if (!thesisInfos) throw new NotFoundException("존재하지 않는 논문 정보입니다.");
    return thesisInfos.map((thesisInfo) => new GetResultResDto(new ThesisInfoDto(thesisInfo)));
  }

  async getReviewList(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    let statusQuery = undefined;
    if (searchQuery.status == SearchStatus.COMPLETE) {
      statusQuery = {
        AND: [
          {
            OR: [{ contentStatus: Status.PASS }, { contentStatus: Status.FAIL }],
          },
          {
            OR: [{ presentationStatus: Status.PASS }, { presentationStatus: Status.FAIL }],
          },
        ],
      };
    } else if (searchQuery.status == SearchStatus.PENDING) {
      statusQuery = {
        NOT: {
          AND: [
            {
              OR: [{ contentStatus: Status.PASS }, { contentStatus: Status.FAIL }],
            },
            {
              OR: [{ presentationStatus: Status.PASS }, { presentationStatus: Status.FAIL }],
            },
          ],
        },
      };
    }
    const reviews = await this.prismaService.review.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        thesisInfo: {
          process: {
            student: {
              deletedAt: null,
              ...(searchQuery.author && { name: { contains: searchQuery.author } }),
              ...(searchQuery.department && { department: { id: searchQuery.department } }),
            },
          },
          stage: { in: [Stage.MAIN, Stage.PRELIMINARY] },
          ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        },
        createdAt: {
          gte: searchQuery.startDate,
          lte: searchQuery.endDate,
        },
        reviewerId: id,
        isFinal: false,
        // NOT: {
        //   thesisInfo: {
        //     stage: Stage.REVISION,
        //   },
        // },
        ...(statusQuery && statusQuery),
      },
      include: {
        reviewer: {
          include: {
            department: true,
          },
        },
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                reviewers: true,
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
            student: {
              deletedAt: null,
              ...(searchQuery.author && { name: { contains: searchQuery.author } }),
              ...(searchQuery.department && { department: { id: searchQuery.department } }),
            },
          },
          ...(searchQuery.stage && { stage: searchQuery.stage }),
          ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        },
        reviewerId: id,
        isFinal: false,
        createdAt: {
          gte: searchQuery.startDate,
          lte: searchQuery.endDate,
        },
        NOT: {
          thesisInfo: {
            stage: Stage.REVISION,
            process: {
              student: {
                deletedAt: null,
              },
            },
          },
        },
        ...(statusQuery && statusQuery),
      },
    });
    return {
      reviews: reviews.map(
        (review) => new GetReviewListResDto(new ReviewDto(review), new ProcessDto(review.thesisInfo.process))
      ),
      totalCount: totalCount,
    };
  }
  async getReviewListExcel(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    let statusQuery = undefined;
    if (searchQuery.status == SearchStatus.COMPLETE) {
      statusQuery = {
        AND: [
          {
            OR: [{ contentStatus: Status.PASS }, { contentStatus: Status.FAIL }],
          },
          {
            OR: [{ presentationStatus: Status.PASS }, { presentationStatus: Status.FAIL }],
          },
        ],
      };
    } else if (searchQuery.status == SearchStatus.PENDING) {
      statusQuery = {
        NOT: {
          AND: [
            {
              OR: [{ contentStatus: Status.PASS }, { contentStatus: Status.FAIL }],
            },
            {
              OR: [{ presentationStatus: Status.PASS }, { presentationStatus: Status.FAIL }],
            },
          ],
        },
      };
    }
    const reviews = (
      await this.prismaService.review.findMany({
        skip: searchQuery.getOffset(),
        take: searchQuery.getLimit(),
        where: {
          thesisInfo: {
            process: {
              student: {
                deletedAt: null,
                ...(searchQuery.author && { name: { contains: searchQuery.author } }),
                ...(searchQuery.department && { department: { id: searchQuery.department } }),
              },
            },
            ...(searchQuery.stage && { stage: searchQuery.stage }),
            ...(searchQuery.title && { title: { contains: searchQuery.title } }),
          },
          reviewerId: id,
          isFinal: false,
          NOT: {
            thesisInfo: {
              stage: Stage.REVISION,
              process: {
                student: {
                  deletedAt: null,
                },
              },
            },
          },
          ...(statusQuery && statusQuery),
        },
        include: {
          reviewer: {
            include: {
              department: true,
            },
          },
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  reviewers: true,
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
    ).map((review) => new GetReviewListResDto(new ReviewDto(review), new ProcessDto(review.thesisInfo.process)));

    const records = reviews.map((review) => {
      const record = {};
      record["저자"] = review.student;
      record["학과"] = review.department;
      if (review.stage == Stage.MAIN) record["구분"] = "본심";
      else if (review.stage == Stage.PRELIMINARY) record["구분"] = "예심";
      record["논문 제목"] = review.title;

      if (review.status == SearchStatus.COMPLETE) record["심사 현황"] = "심사 완료";
      else if (review.status == SearchStatus.PENDING) record["심사 현황"] = "진행중";
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
        thesisInfo: {
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
        NOT: {
          thesisInfo: {
            stage: Stage.REVISION,
          },
        },
      },
      include: {
        reviewer: {
          include: {
            department: true,
          },
        },
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                reviewers: true,
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
    if (!review) throw new NotFoundException("존재하지 않는 심사 정보입니다.");
    if (review.reviewerId != userId) throw new BadRequestException("본인의 논문 심사가 아닙니다.");
    return new ReviewDto(review);
  }
  async updateReview(id: number, updateReviewDto: UpdateReviewReqDto, user: User) {
    const userId = user.id;
    const userType = user.type;
    const fileUUID = updateReviewDto.fileUUID;
    const foundReview = await this.prismaService.review.findUnique({
      where: {
        id,
        isFinal: false,
        thesisInfo: {
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
      },
      include: {
        reviewer: true,
        thesisInfo: {
          include: {
            thesisFiles: true,
            process: {
              include: {
                student: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const submitted = foundReview.thesisInfo.thesisFiles.filter((file) => {
      return file.fileId == null;
    });
    if (submitted.length != 0) {
      throw new BadRequestException("미제출파일이 있는 학생은 심사할 수 없습니다.");
    }
    if (!foundReview) throw new NotFoundException("존재하지 않는 심사정보입니다");
    if (userType == UserType.PROFESSOR && foundReview.reviewerId != userId) {
      throw new BadRequestException("본인의 논문 심사가 아닙니다.");
    }
    if (fileUUID) {
      const foundFile = await this.prismaService.file.findUnique({
        where: {
          uuid: fileUUID,
        },
      });
      if (!foundFile) throw new NotFoundException("존재하지 않는 심사파일입니다.");
    }
    const isMain = foundReview.thesisInfo.stage == Stage.MAIN ? true : false;

    try {
      const review = await this.prismaService.$transaction(async (tx) => {
        // 1. 먼저 리뷰를 업데이트
        const updatedReview = await tx.review.update({
          where: {
            id,
            isFinal: false,
          },
          data: {
            contentStatus: updateReviewDto.contentStatus,
            ...(foundReview.thesisInfo.stage == Stage.MAIN && {
              presentationStatus: updateReviewDto.presentationStatus,
            }),
            comment: updateReviewDto.comment,
          },
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
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
              },
            },
          },
        });

        // 2. 업데이트된 데이터로 PDF 생성
        let file;
        if (!updateReviewDto.fileUUID) {
          let replacer;
          if (updatedReview.thesisInfo.stage == Stage.MAIN) {
            if (
              (updateReviewDto.contentStatus == Status.PASS || updateReviewDto.contentStatus == Status.FAIL) &&
              (updateReviewDto.presentationStatus == Status.PASS || updateReviewDto.presentationStatus == Status.FAIL)
            ) {
              replacer = {
                $학과: updatedReview.thesisInfo.process.student.department.name,
                $학번: updatedReview.thesisInfo.process.student.loginId,
                $이름: updatedReview.thesisInfo.process.student.name,
                "$내용:합격": updateReviewDto.contentStatus == Status.PASS ? "O" : "",
                "$내용:불합격": updateReviewDto.contentStatus == Status.FAIL ? "O" : "",
                "$구두:합격": updateReviewDto.presentationStatus == Status.PASS ? "O" : "",
                "$구두:불합격": updateReviewDto.presentationStatus == Status.FAIL ? "O" : "",
                $심사의견: updateReviewDto.comment.replace(/\n/g, "<br>\n"),
                $year: getCurrentTime().year.toString(),
                $month: getCurrentTime().month.toString().padStart(2, "0"),
                $day: getCurrentTime().date.toString().padStart(2, "0"),
                "$심사위원:성명": updatedReview.reviewer.name,
                $서명: updatedReview.reviewer.signId,
              };
              file = await this.buildReportPdf(
                updatedReview.id,
                replacer,
                true,
                updatedReview.thesisInfo.process.student.name,
                updatedReview.reviewer.name
              );
            }
          } else if (updatedReview.thesisInfo.stage == Stage.PRELIMINARY) {
            if (updateReviewDto.contentStatus == Status.PASS || updateReviewDto.contentStatus == Status.FAIL) {
              replacer = {
                $학과: updatedReview.thesisInfo.process.student.department.name,
                $학번: updatedReview.thesisInfo.process.student.loginId,
                $이름: updatedReview.thesisInfo.process.student.name,
                $합격: updateReviewDto.contentStatus == Status.PASS ? "O" : "",
                $불합격: updateReviewDto.contentStatus == Status.FAIL ? "O" : "",
                $심사의견: updateReviewDto.comment.replace(/\n/g, "<br>\n"),
                $year: getCurrentTime().year.toString(),
                $month: getCurrentTime().month.toString().padStart(2, "0"),
                $day: getCurrentTime().date.toString().padStart(2, "0"),
                "$심사위원:성명": updatedReview.reviewer.name,
                $서명: updatedReview.reviewer.signId,
              };
              file = await this.buildReportPdf(
                updatedReview.id,
                replacer,
                false,
                updatedReview.thesisInfo.process.student.name,
                updatedReview.reviewer.name
              );
            }
          }
        }

        // 3. 파일 ID 업데이트
        const fileUUID = updateReviewDto.fileUUID ? updateReviewDto.fileUUID : file?.uuid;
        return await tx.review.update({
          where: {
            id,
            isFinal: false,
          },
          data: {
            ...(fileUUID && { fileId: fileUUID }),
          },
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            file: true,
            thesisInfo: {
              include: {
                process: {
                  include: {
                    reviewers: true,
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
      });

      return new ReviewDto(review);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("심사정보 수정 오류");
    }
  }

  async getReviewFinalList(searchQuery: SearchReviewReqDto, user: User) {
    const { id } = user;
    let status;
    if (searchQuery.status == SearchStatus.PENDING) {
      status = [Status.UNEXAMINED];
    } else if (searchQuery.status == SearchStatus.COMPLETE) {
      status = [Status.PASS, Status.FAIL];
    }
    const reviews = await this.prismaService.review.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        thesisInfo: {
          process: {
            headReviewerId: id,
            student: {
              deletedAt: null,
              ...(searchQuery.author && { name: { contains: searchQuery.author } }),
              ...(searchQuery.department && { department: { id: searchQuery.department } }),
            },
          },
          ...(searchQuery.stage && { stage: searchQuery.stage }),
          ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        },
        createdAt: {
          gte: searchQuery.startDate,
          lte: searchQuery.endDate,
        },
        isFinal: true,
        ...(searchQuery.status && { contentStatus: { in: status } }),
      },
      include: {
        reviewer: {
          include: {
            department: true,
          },
        },
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                reviewers: true,
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
            student: {
              deletedAt: null,
            },
          },
        },
        isFinal: true,
        createdAt: {
          gte: searchQuery.startDate,
          lte: searchQuery.endDate,
        },
        ...(searchQuery.author && {
          thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
        }),
        ...(searchQuery.department && {
          thesisInfo: { process: { student: { department: { id: searchQuery.department } } } },
        }),
        ...(searchQuery.stage && { thesisInfo: { stage: searchQuery.stage } }),
        ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
        ...(searchQuery.status && { contentStatus: { in: status } }),
      },
    });
    return {
      reviews: reviews.map(
        (review) => new GetReviewFinalListResDto(new ReviewDto(review), new ProcessDto(review.thesisInfo.process))
      ),
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
              student: {
                deletedAt: null,
                ...(searchQuery.author && { name: { contains: searchQuery.author } }),
                ...(searchQuery.department && { department: { id: searchQuery.department } }),
              },
            },
            ...(searchQuery.stage && { stage: searchQuery.stage }),
            ...(searchQuery.title && { title: { contains: searchQuery.title } }),
          },
          isFinal: true,
          ...(searchQuery.status && { status: searchQuery.status }),
        },
        include: {
          reviewer: {
            include: {
              department: true,
            },
          },
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  reviewers: true,
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
    ).map((review) => new GetReviewFinalListResDto(new ReviewDto(review), new ProcessDto(review.thesisInfo.process)));
    const records = reviews.map((review) => {
      const record = {};
      record["저자"] = review.student;
      record["학과"] = review.department;
      if (review.stage == Stage.MAIN) record["구분"] = "본심";
      else if (review.stage == Stage.PRELIMINARY) record["구분"] = "예심";
      record["논문 제목"] = review.title;
      if (review.status == SearchStatus.COMPLETE) record["심사 현황"] = "심사 완료";
      else if (review.status == SearchStatus.PENDING) record["심사 현황"] = "심사 대기";
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
        thesisInfo: {
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
      },
      include: {
        reviewer: {
          include: {
            department: true,
          },
        },
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
                reviewers: true,
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
    if (!review) throw new NotFoundException("존재하지 않는 심사 정보입니다.");
    if (review.reviewerId != userId) throw new BadRequestException("본인의 논문 심사가 아닙니다.");

    const otherReviews = await this.prismaService.review.findMany({
      where: {
        isFinal: false,
        thesisInfoId: review.thesisInfo.id,
      },

      include: {
        reviewer: {
          select: {
            name: true,
          },
        },
        file: true,
      },
    });
    return { review, otherReviews };
  }
  async updateReviewFinal(id: number, updateReviewFinalDto: UpdateReviewFinalReqDto, user: User) {
    const userId = user.id;
    const userType = user.type;
    const fileUUID = updateReviewFinalDto.fileUUID;
    const foundReview = await this.prismaService.review.findUnique({
      where: {
        id,
        isFinal: true,
        thesisInfo: {
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
      },
      include: {
        reviewer: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                reviewers: true,
                student: {
                  include: {
                    department: true,
                  },
                },
              },
            },
            reviews: {
              include: {
                reviewer: true,
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
    const otherReviews = await this.prismaService.review.findMany({
      where: {
        thesisInfoId: foundReview.thesisInfoId,
        isFinal: false,
      },
    });

    // 합격인 심사의 개수를 카운트
    const passCount = otherReviews.filter((review) => review.contentStatus === Status.PASS).length;
    const threshold = Math.ceil(otherReviews.length / 2);

    // 합격인 심사의 개수가 과반수 미만이면 심사가 모두 완료되어야 함
    if (passCount < threshold) {
      const notSubmitted = otherReviews.filter((review) => {
        if (review.contentStatus == Status.FAIL || review.contentStatus == Status.PASS) {
          return false;
        }
        return true;
      });

      if (notSubmitted.length > 0) {
        throw new BadRequestException("심사가 완료되지 않았습니다.");
      }
    }

    if (!foundReview) throw new NotFoundException("존재하지 않는 심사정보입니다");
    if (userType == UserType.PROFESSOR) {
      if (foundReview.reviewerId != userId) throw new BadRequestException("본인의 논문 심사가 아닙니다.");
      if (foundReview.contentStatus == Status.PASS || foundReview.contentStatus == Status.FAIL)
        throw new BadRequestException("수정 불가능한 논문심사입니다.");
    }
    if (fileUUID) {
      const foundFile = await this.prismaService.file.findUnique({
        where: {
          uuid: fileUUID,
        },
      });
      if (!foundFile) throw new NotFoundException("존재하지 않는 심사파일입니다.");
    }

    try {
      const review = await this.prismaService.$transaction(async (tx) => {
        // 1. 먼저 리뷰를 업데이트
        const updatedReview = await tx.review.update({
          where: {
            id,
            isFinal: true,
          },
          data: {
            contentStatus: updateReviewFinalDto.contentStatus,
            comment: updateReviewFinalDto.comment,
          },
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            thesisInfo: {
              include: {
                process: {
                  include: {
                    reviewers: true,
                    student: {
                      include: {
                        department: true,
                      },
                    },
                  },
                },
                reviews: {
                  include: {
                    reviewer: true,
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

        // 2. summary 업데이트
        if (updatedReview.contentStatus == Status.PASS || updatedReview.contentStatus == Status.FAIL) {
          await tx.thesisInfo.update({
            where: {
              id: updatedReview.thesisInfoId,
            },
            data: {
              summary: updatedReview.contentStatus,
            },
          });
        }

        // 3. 업데이트된 데이터로 PDF 생성
        let file;
        if (!updateReviewFinalDto.fileUUID) {
          let replacer;
          if (updatedReview.thesisInfo.stage == Stage.MAIN) {
            if (
              updateReviewFinalDto.contentStatus == Status.PASS ||
              updateReviewFinalDto.contentStatus == Status.FAIL
            ) {
              replacer = {
                $학과: updatedReview.thesisInfo.process.student.department.name,
                $학번: updatedReview.thesisInfo.process.student.loginId,
                $이름: updatedReview.thesisInfo.process.student.name,
                $논문제목: updatedReview.thesisInfo.title,
                $심사위원장: [],
                $심사위원: [],
                $지도교수: [],
                $종합의견: updateReviewFinalDto.comment.replace(/\n/g, "<br>\n"),
                $year: getCurrentTime().year.toString(),
                $month: getCurrentTime().month.toString().padStart(2, "0"),
                $day: getCurrentTime().date.toString().padStart(2, "0"),
                "$심사위원장:성명": updatedReview.reviewer.name,
                $서명: updatedReview.reviewer.signId,
              };

              // 업데이트된 reviews 데이터 사용
              for (const singleReview of updatedReview.thesisInfo.reviews) {
                for (const reviewer of updatedReview.thesisInfo.process.reviewers) {
                  if (singleReview.reviewerId == reviewer.reviewerId) {
                    if (reviewer.role == Role.COMMITTEE_CHAIR) {
                      if (singleReview.isFinal) {
                        replacer["$심사위원장"].push({
                          $성명: singleReview.reviewer.name,
                          "$내용:합격": singleReview.contentStatus === "PASS" ? "O" : "",
                          "$내용:불합격": singleReview.contentStatus === "FAIL" ? "O" : "",
                          "$구두:합격": singleReview.contentStatus === "PASS" ? "O" : "",
                          "$구두:불합격": singleReview.contentStatus === "FAIL" ? "O" : "",
                        });
                      }
                    } else if (reviewer.role == Role.COMMITTEE_MEMBER) {
                      replacer["$심사위원"].push({
                        $성명: singleReview.reviewer.name,
                        "$내용:합격": singleReview.contentStatus === "PASS" ? "O" : "",
                        "$내용:불합격": singleReview.contentStatus === "FAIL" ? "O" : "",
                        "$구두:합격": singleReview.presentationStatus === "PASS" ? "O" : "",
                        "$구두:불합격": singleReview.presentationStatus === "FAIL" ? "O" : "",
                      });
                    } else if (reviewer.role == Role.ADVISOR) {
                      replacer["$지도교수"].push({
                        $성명: singleReview.reviewer.name,
                        "$내용:합격": singleReview.contentStatus === "PASS" ? "O" : "",
                        "$내용:불합격": singleReview.contentStatus === "FAIL" ? "O" : "",
                        "$구두:합격": singleReview.presentationStatus === "PASS" ? "O" : "",
                        "$구두:불합격": singleReview.presentationStatus === "FAIL" ? "O" : "",
                      });
                    }
                  }
                }
              }
            }
          } else if (updatedReview.thesisInfo.stage == Stage.PRELIMINARY) {
            if (
              updateReviewFinalDto.contentStatus == Status.PASS ||
              updateReviewFinalDto.contentStatus == Status.FAIL
            ) {
              replacer = {
                $학과: updatedReview.thesisInfo.process.student.department.name,
                $학번: updatedReview.thesisInfo.process.student.loginId,
                $이름: updatedReview.thesisInfo.process.student.name,
                $논문제목: updatedReview.thesisInfo.title,
                $심사위원장: [],
                $심사위원: [],
                $지도교수: [],
                $종합의견: updateReviewFinalDto.comment.replace(/\n/g, "<br>\n"),
                $year: getCurrentTime().year.toString(),
                $month: getCurrentTime().month.toString().padStart(2, "0"),
                $day: getCurrentTime().date.toString().padStart(2, "0"),
                "$심사위원장:성명": updatedReview.reviewer.name,
                $서명: updatedReview.reviewer.signId,
              };

              // 업데이트된 reviews 데이터 사용
              for (const singleReview of updatedReview.thesisInfo.reviews) {
                for (const reviewer of updatedReview.thesisInfo.process.reviewers) {
                  if (singleReview.reviewerId == reviewer.reviewerId) {
                    if (reviewer.role == Role.COMMITTEE_CHAIR) {
                      if (singleReview.isFinal) {
                        replacer["$심사위원장"].push({
                          $성명: singleReview.reviewer.name,
                          $합격: singleReview.contentStatus === "PASS" ? "O" : "",
                          $불합격: singleReview.contentStatus === "FAIL" ? "O" : "",
                        });
                      }
                    } else if (reviewer.role == Role.COMMITTEE_MEMBER) {
                      replacer["$심사위원"].push({
                        $성명: singleReview.reviewer.name,
                        $합격: singleReview.contentStatus === "PASS" ? "O" : "",
                        $불합격: singleReview.contentStatus === "FAIL" ? "O" : "",
                      });
                    } else if (reviewer.role == Role.ADVISOR) {
                      replacer["$지도교수"].push({
                        $성명: singleReview.reviewer.name,
                        $합격: singleReview.contentStatus === "PASS" ? "O" : "",
                        $불합격: singleReview.contentStatus === "FAIL" ? "O" : "",
                      });
                    }
                  }
                }
              }
            }
          }

          const isMain = updatedReview.thesisInfo.stage == Stage.MAIN ? true : false;
          file = await this.buildResultPdf(
            updatedReview.id,
            replacer,
            isMain,
            updatedReview.thesisInfo.process.student.name
          );
        }

        // 4. 파일 ID 업데이트
        const fileUUID = updateReviewFinalDto.fileUUID ? updateReviewFinalDto.fileUUID : file?.uuid;
        return await tx.review.update({
          where: {
            id,
            isFinal: true,
          },
          data: {
            ...(fileUUID && { fileId: fileUUID }),
          },
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            file: true,
            thesisInfo: {
              include: {
                process: {
                  include: {
                    reviewers: true,
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
      });

      return new ReviewDto(review);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("최종 심사정보 수정 오류");
    }
  }

  async getRevisionList(searchQuery: SearchRevisionReqDto, user: User) {
    const { id } = user;
    const reviews = await this.prismaService.review.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        reviewerId: id,
        isFinal: false,
        thesisInfo: {
          stage: Stage.REVISION,
          process: {
            student: {
              deletedAt: null,
              ...(searchQuery.author && { name: { contains: searchQuery.author } }),
              ...(searchQuery.department && { department: { id: searchQuery.department } }),
            },
          },
          ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        },
        ...(searchQuery.contentStatus && { contentStatus: searchQuery.contentStatus }),
      },
      include: {
        reviewer: {
          include: {
            department: true,
          },
        },
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                reviewers: true,
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
        isFinal: true,
        thesisInfo: {
          stage: Stage.REVISION,
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
        ...(searchQuery.author && {
          thesisInfo: { process: { student: { name: { contains: searchQuery.author } } } },
        }),
        ...(searchQuery.department && {
          thesisInfo: { process: { student: { department: { id: searchQuery.department } } } },
        }),
        ...(searchQuery.title && { thesisInfo: { title: { contains: searchQuery.title } } }),
        ...(searchQuery.contentStatus && { contentStatus: searchQuery.contentStatus }),
      },
    });
    return {
      reviews: reviews.map((review) => new GetRevisionListResDto(new ReviewDto(review))),
      totalCount: totalCount,
    };
  }
  async getRevisionListExcel(searchQuery: SearchRevisionReqDto, user: User) {
    const { id } = user;
    const reviews = (
      await this.prismaService.review.findMany({
        where: {
          reviewerId: id,
          isFinal: false,
          thesisInfo: {
            stage: Stage.REVISION,
            process: {
              student: {
                deletedAt: null,
                ...(searchQuery.author && { name: { contains: searchQuery.author } }),
                ...(searchQuery.department && { department: { id: searchQuery.department } }),
              },
            },
            ...(searchQuery.title && { title: { contains: searchQuery.title } }),
          },
          ...(searchQuery.contentStatus && { contentStatus: searchQuery.contentStatus }),
        },
        include: {
          reviewer: {
            include: {
              department: true,
            },
          },
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  reviewers: true,
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
    ).map((review) => new GetRevisionListResDto(review));
    const records = reviews.map((review) => {
      const record = {};
      record["저자"] = review.student;
      record["학과"] = review.department;
      record["논문 제목"] = review.title;
      if (review.status == Status.PASS) record["확인 여부"] = "확인 완료";
      else if (review.status == Status.UNEXAMINED) record["확인 여부"] = "미확인";
      return record;
    });

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(records);
    utils.book_append_sheet(workbook, worksheet, "목록");

    return {
      filename: await this.buildFilename("수정_확인_목록_", searchQuery, true),
      file: write(workbook, { type: "buffer", bookType: "xlsx" }),
    };
  }
  async getRevision(id: number, user: User) {
    const userId = user.id;
    const review = await this.prismaService.review.findUnique({
      where: {
        id,
        isFinal: false,
        thesisInfo: {
          stage: Stage.REVISION,
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
      },
      include: {
        reviewer: {
          include: {
            department: true,
          },
        },
        file: true,
        thesisInfo: {
          include: {
            process: {
              include: {
                reviewers: true,
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
    if (!review) throw new NotFoundException("존재하지 않는 심사 정보입니다.");
    if (review.reviewerId != userId) throw new BadRequestException("본인의 논문 심사가 아닙니다.");
    return new ReviewDto(review);
  }
  async updateRevision(id: number, updateReivisionDto: UpdateRevisionReqDto, user: User) {
    const userId = user.id;
    const userType = user.type;
    const foundReview = await this.prismaService.review.findUnique({
      where: {
        id,
        isFinal: false,
        thesisInfo: {
          process: {
            student: {
              deletedAt: null,
            },
          },
        },
      },
    });
    if (!foundReview) throw new NotFoundException("존재하지 않는 심사정보입니다");
    if (userType == UserType.PROFESSOR) {
      if (foundReview.reviewerId != userId) throw new BadRequestException("본인의 논문 심사가 아닙니다.");
    }
    try {
      const review = await this.prismaService.review.update({
        where: {
          id,
          isFinal: false,
        },
        data: {
          contentStatus: updateReivisionDto.contentStatus,
        },
        include: {
          reviewer: {
            include: {
              department: true,
            },
          },
          file: true,
          thesisInfo: {
            include: {
              process: {
                include: {
                  reviewers: true,
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

  async getCurrentList(searchQuery: SearchCurrentReqDto) {
    const results = await this.prismaService.thesisInfo.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        process: {
          student: {
            deletedAt: null,
            ...(searchQuery.author && { name: { contains: searchQuery.author } }),
            ...(searchQuery.department && { department: { id: searchQuery.department } }),
          },
        },
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        // summary: { in: [Summary.PENDING, Summary.UNEXAMINED] }, 행정실 요구 사항에 따라 수정
      },
      include: {
        process: {
          include: {
            reviewers: true,
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
        reviews: {
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });
    const totalCount = await this.prismaService.thesisInfo.count({
      where: {
        process: {
          student: {
            deletedAt: null,
            ...(searchQuery.author && { name: { contains: searchQuery.author } }),
            ...(searchQuery.department && { department: { id: searchQuery.department } }),
          },
        },
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        // summary: { in: [Summary.PENDING, Summary.UNEXAMINED] }, 행정실 요구 사항에 따라 수정
      },
    });
    return {
      results: results.map((result) => new GetCurrentListResDto(new ThesisInfoDto(result))),
      totalCount: totalCount,
    };
  }
  async getCurrentListExcel(searchQuery: SearchCurrentReqDto) {
    const results = await this.prismaService.thesisInfo.findMany({
      where: {
        process: {
          student: {
            deletedAt: null,
            ...(searchQuery.author && { name: { contains: searchQuery.author } }),
            ...(searchQuery.department && { department: { id: searchQuery.department } }),
          },
        },
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        // summary: { in: [Summary.PENDING, Summary.UNEXAMINED] }, 행정실 요구 사항에 따라 수정
      },
      include: {
        process: {
          include: {
            reviewers: true,
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
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    const records = results.map((result) => {
      const record = {};
      record["학번"] = result.process.student.loginId;
      record["저자"] = result.process.student.name;
      record["학과"] = result.process.student.department.name;
      if (result.stage == Stage.MAIN) record["구분"] = "본심";
      else if (result.stage == Stage.PRELIMINARY) record["구분"] = "예심";
      else if (result.stage == Stage.REVISION) record["구분"] = "수정";
      record["논문 제목"] = result.title;
      result.reviews.forEach((review, idx) => {
        record[`심사 현황${idx + 1}`] = "";
        record[`심사 현황${idx + 1}`] += review.reviewer.name;
        result.process.reviewers.forEach((reviewer) => {
          if (reviewer.reviewerId == review.reviewer.id && reviewer.processId == result.processId) {
            if (reviewer.role == Role.ADVISOR) {
              record[`심사 현황${idx + 1}`] += "(지도교수)/";
              return;
            } else if (reviewer.role == Role.COMMITTEE_CHAIR) {
              record[`심사 현황${idx + 1}`] += "(심사위원장)/";
              return;
            } else if (reviewer.role == Role.COMMITTEE_MEMBER) {
              record[`심사 현황${idx + 1}`] += "(심사위원)/";
              return;
            }
          }
        });
        if ((result.stage == Stage.MAIN || result.stage == Stage.PRELIMINARY) && review.isFinal == false) {
          if (
            ((review.contentStatus == Status.PASS || review.contentStatus == Status.FAIL) &&
              review.presentationStatus == Status.PASS) ||
            review.presentationStatus == Status.FAIL
          )
            record[`심사 현황${idx + 1}`] += "진행완료  ";
          else record[`심사 현황${idx + 1}`] += "진행중  ";
        } else if (review.isFinal) {
          if (review.contentStatus == Status.PASS || review.contentStatus == Status.FAIL)
            record[`심사 현황${idx + 1}`] += "(최종심사)진행완료  ";
          else record[`심사 현황${idx + 1}`] += "(최종심사)진행중  ";
        } else if (result.stage == Stage.REVISION) {
          if (review.contentStatus == Status.PASS) record[`심사 현황${idx + 1}`] += "진행완료  ";
          else record[`심사 현황${idx + 1}`] += "진행중 ";
        }
      });
      return record;
    });

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(records);
    utils.book_append_sheet(workbook, worksheet, "목록");

    return {
      filename: await this.buildFilename("심사현황_목록_", searchQuery),
      file: write(workbook, { type: "buffer", bookType: "xlsx" }),
    };
  }
  async getCurrent(id: number) {
    const result = await this.prismaService.thesisInfo.findUnique({
      where: {
        id,
        process: {
          student: {
            deletedAt: null,
          },
        },
      },
      include: {
        process: {
          include: {
            reviewers: true,
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
        reviews: {
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            file: true,
          },
        },
      },
    });
    if (!result) throw new NotFoundException("존재하지 않는 논문 정보입니다.");
    return new ThesisInfoDto(result);
  }

  async getResultList(searchQuery: SearchResultReqDto) {
    const results = await this.prismaService.thesisInfo.findMany({
      skip: searchQuery.getOffset(),
      take: searchQuery.getLimit(),
      where: {
        process: {
          student: {
            deletedAt: null,
            ...(searchQuery.author && { name: { contains: searchQuery.author } }),
            ...(searchQuery.department && { department: { id: searchQuery.department } }),
          },
        },
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        ...(searchQuery.summary && { summary: searchQuery.summary }),
        AND: [
          {
            NOT: {
              summary: Summary.UNEXAMINED,
            },
          },
          {
            NOT: {
              summary: Summary.PENDING,
            },
          },
        ],
      },
      include: {
        process: {
          include: {
            reviewers: true,
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
        reviews: {
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            file: true,
          },
        },
      },
    });
    const totalCount = await this.prismaService.thesisInfo.count({
      where: {
        ...(searchQuery.author && { process: { student: { name: { contains: searchQuery.author } } } }),
        process: {
          student: {
            deletedAt: null,
            ...(searchQuery.department && { department: { id: searchQuery.department } }),
          },
        },
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        ...(searchQuery.summary && { summary: searchQuery.summary }),
        AND: [
          {
            NOT: {
              summary: Summary.UNEXAMINED,
            },
          },
          {
            NOT: {
              summary: Summary.PENDING,
            },
          },
        ],
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
          process: {
            student: {
              deletedAt: null,
              ...(searchQuery.author && { name: { contains: searchQuery.author } }),
              ...(searchQuery.department && { department: { id: searchQuery.department } }),
            },
          },
          ...(searchQuery.stage && { stage: searchQuery.stage }),
          ...(searchQuery.title && { title: { contains: searchQuery.title } }),
          ...(searchQuery.summary && { summary: searchQuery.summary }),
          AND: [
            {
              NOT: {
                summary: Summary.UNEXAMINED,
              },
            },
            {
              NOT: {
                summary: Summary.PENDING,
              },
            },
          ],
        },
        include: {
          process: {
            include: {
              reviewers: true,
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
      else if (result.stage == Stage.REVISION) record["구분"] = "수정";
      record["논문 제목"] = result.title;
      if (result.summary == Summary.PASS) record["심사 결과"] = "합격";
      else if (result.summary == Summary.FAIL) record["심사 결과"] = "불합격";
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
  async getResultReport(searchQuery: SearchResultReqDto) {
    const zip = new Zip();
    const results = await this.prismaService.thesisInfo.findMany({
      where: {
        process: {
          student: {
            deletedAt: null,
            ...(searchQuery.author && { name: { contains: searchQuery.author } }),
            ...(searchQuery.department && { department: { id: searchQuery.department } }),
          },
        },
        ...(searchQuery.stage && { stage: searchQuery.stage }),
        ...(searchQuery.title && { title: { contains: searchQuery.title } }),
        ...(searchQuery.summary && { summary: searchQuery.summary }),
        AND: [
          {
            NOT: {
              summary: Summary.UNEXAMINED,
            },
          },
          {
            NOT: {
              summary: Summary.PENDING,
            },
          },
        ],
      },
      include: {
        process: {
          include: {
            student: true,
          },
        },
        reviews: {
          include: {
            reviewer: true,
            file: true,
          },
        },
      },
    });
    for await (const result of results) {
      for await (const review of result.reviews) {
        if (review.file) {
          const readable = await this.minioClientService.getFile(review.file.uuid);
          const readStream = new Promise((resolve) => {
            const bufs = [];
            readable.on("data", (data) => {
              bufs.push(data);
            });
            readable.resume().on("end", () => {
              let filename;
              if (review.isFinal) filename = result.id.toString() + "_심사결과보고서_" + review.reviewer.name + ".pdf";
              else filename = result.id.toString() + "_심사보고서_" + review.reviewer.name + ".pdf";
              zip.file(filename, Buffer.concat(bufs));
              resolve(null);
            });
          });
          await readStream;
        }
      }
    }
    return zip
      .generateAsync({
        type: "nodebuffer",
      })
      .then(async (buf) => {
        return {
          filename: this.buildFilename("심사보고서_", searchQuery).replace(".xlsx", ".zip"),
          file: buf,
        };
      });
  }
  async getResult(id: number) {
    const result = await this.prismaService.thesisInfo.findUnique({
      where: {
        id,
        process: {
          student: {
            deletedAt: null,
          },
        },
      },
      include: {
        process: {
          include: {
            reviewers: true,
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
        reviews: {
          include: {
            reviewer: {
              include: {
                department: true,
              },
            },
            file: true,
          },
        },
      },
    });
    if (!result) throw new NotFoundException("존재하지 않는 논문 정보입니다.");
    return new ThesisInfoDto(result);
  }
}
