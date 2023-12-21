import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { UserType } from "src/common/enums/user-type.enum";
import { PrismaService } from "src/config/database/prisma.service";
import { StudentPageQuery } from "./dtos/student-page-query.dto";
import { User } from "@prisma/client";
import { GetStudentExcelQuery } from "./dtos/get-student-excel-query.dto";
import * as XLSX from "xlsx";
import * as DateUtil from "../../common/utils/date.util";
import * as path from "path";
import * as fs from "fs";
import { CreateStudentDto } from "./dtos/create-student.dto";
import { AuthService } from "../auth/auth.service";
import { Stage } from "src/common/enums/stage.enum";
import { Summary } from "src/common/enums/summary.enum";
import { ThesisFileType } from "src/common/enums/thesis-file-type.enum";
import { ReviewStatus } from "src/common/enums/review-status.enum";

@Injectable()
export class StudentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}
  async getStudentList(studentPageQuery: StudentPageQuery) {
    const { studentNumber, name, email, phone, departmentId, phaseId, isLock } = studentPageQuery;

    if (departmentId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: {
          id: departmentId,
        },
      });
      if (!foundDept) {
        throw new BadRequestException("해당하는 학과가 없습니다.");
      }
    }
    if (phaseId) {
      const foundPhase = await this.prismaService.phase.findUnique({
        where: {
          id: phaseId,
        },
      });
      if (!foundPhase) {
        throw new BadRequestException("해당하는 시스템 단계가 없습니다.");
      }
    }

    const students = await this.prismaService.user.findMany({
      where: {
        type: UserType.STUDENT,
        loginId: studentNumber ? { contains: studentNumber } : undefined,
        name: name ? { contains: name } : undefined,
        email: email ? { contains: email } : undefined,
        phone: phone ? { contains: phone } : undefined,
        department: departmentId ? { id: departmentId } : undefined,
        studentProcess:
          phaseId || isLock !== undefined
            ? {
                phase: phaseId ? { id: phaseId } : undefined,
                isLock: isLock !== undefined ? isLock : undefined,
              }
            : undefined,
      },
      include: {
        department: true,
        studentProcess: {
          include: {
            phase: true,
          },
        },
      },
      skip: studentPageQuery.getOffset(),
      take: studentPageQuery.getLimit(),
    });

    const totalCount = await this.prismaService.user.count({
      where: {
        type: UserType.STUDENT,
        loginId: studentNumber ? { contains: studentNumber } : undefined,
        name: name ? { contains: name } : undefined,
        email: email ? { contains: email } : undefined,
        phone: phone ? { contains: phone } : undefined,
        department: departmentId ? { id: departmentId } : undefined,
        studentProcess:
          phaseId || isLock !== undefined
            ? {
                phase: phaseId ? { id: phaseId } : undefined,
                isLock: isLock !== undefined ? isLock : undefined,
              }
            : undefined,
      },
    });

    return { totalCount, students };
  }

  async getStudentExcel(studentExcelQuery: GetStudentExcelQuery) {
    const { studentNumber, name, email, phone, departmentId, phaseId, isLock } = studentExcelQuery;

    if (departmentId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: {
          id: departmentId,
        },
      });
      if (!foundDept) {
        throw new BadRequestException("해당하는 학과가 없습니다.");
      }
    }
    if (phaseId) {
      const foundPhase = await this.prismaService.phase.findUnique({
        where: {
          id: phaseId,
        },
      });
      if (!foundPhase) {
        throw new BadRequestException("해당하는 시스템 단계가 없습니다.");
      }
    }

    const processes = await this.prismaService.process.findMany({
      where: {
        student: {
          type: UserType.STUDENT,
          loginId: studentNumber ? { contains: studentNumber } : undefined,
          name: name ? { contains: name } : undefined,
          email: email ? { contains: email } : undefined,
          phone: phone ? { contains: phone } : undefined,
          department: departmentId ? { id: departmentId } : undefined,
        },
        phase: phaseId ? { id: phaseId } : undefined,
        isLock: isLock !== undefined ? isLock : undefined,
      },
      include: {
        student: { include: { department: true } },
        thesisInfos: { orderBy: { stage: "asc" } },
        headReviewer: true,
        reviewers: { include: { reviewer: true } },
        phase: true,
      },
    });

    // 보내줄 데이터 json 형식으로 정리
    const records = processes.map((process) => {
      const record = {};
      const student = process.student;
      const dept = student.department;
      const thesisInfos = process.thesisInfos;
      const headReviewer = process.headReviewer;
      const reviewers = process.reviewers;
      const phase = process.phase;

      // 학생 회원 정보
      record["학번"] = student.loginId;
      record["이름"] = student.name;
      record["이메일"] = student.email;
      record["연락처"] = student.phone;
      record["전공"] = dept.name;

      // 학생 논문 정보
      record["예심 논문 제목"] = thesisInfos[0].title ? thesisInfos[0].title : "미제출";
      record["예심 심사 상태"] = thesisInfos[0].summary;
      record["본심 논문 제목"] = thesisInfos[1].title ? thesisInfos[1].title : "미제출";
      record["본심 심사 상태"] = thesisInfos[1].summary;

      // 교수 배정 정보
      record["심사위원장"] = headReviewer.name;
      reviewers.forEach((reviewerInfo, index) => {
        record[`심사위원-${index + 1}`] = reviewerInfo.reviewer.name;
      });

      // 시스템 정보
      record["시스템 단계"] = phase.title;
      record["시스템 락 여부"] = process.isLock;

      // TODO (제출 상태) : 넣을까 말까.. 솦 졸논에 비슷한 기능이 있는데 행정실에서 먼저 요청하지 않으면 굳이 포함하지 않는 것도 방법일 듯...ㅎ
      // record['예심 논문 파일 상태'];
      // record['예심 논문 발표 파일 상태'];
      // record['본심 논문 파일 상태'];
      // record['본심 논문 발표 파일 상태'];

      return record;
    });
    if (!records.length) {
      const record = {};
      record["검색된 학생이 없습니다."] = "";
      records.push(record);
    }

    // 엑셀 데이터 생성
    const excelData = XLSX.utils.json_to_sheet(records);
    const workBook = XLSX.utils.book_new();
    const fileName = "student_list_" + DateUtil.getCurrentTime().fullDateTime + ".xlsx";
    const filePath = path.join("resources", "excel", fileName);

    // `resources/excel`디렉토리에 파일 생성
    XLSX.utils.book_append_sheet(workBook, excelData, "student_list");
    await XLSX.writeFile(workBook, filePath);

    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath);
      // 파일 삭제
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) return console.log("삭제할 수 없는 파일입니다.");
        fs.unlink(filePath, (err) => (err ? console.log(err) : console.log("파일을 삭제했습니다.")));
      });
      return { fileName, stream };
    } else {
      throw new InternalServerErrorException("파일을 생성하지 못했습니다.");
    }
  }

  async getStudent(studentId: number, user: User) {
    if (user.type === UserType.STUDENT && studentId !== user.id) {
      throw new UnauthorizedException("다른 학생의 정보는 조회할 수 없습니다.");
    }

    const student = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: {
        department: true,
        studentProcess: {
          include: {
            phase: true,
          },
        },
      },
    });
    if (!student) {
      throw new BadRequestException("해당하는 학생을 찾을 수 없습니다.");
    }

    return student;
  }

  async createStudent(createStudentDto: CreateStudentDto) {
    const {
      loginId,
      password,
      name,
      email,
      phone,
      deptId,
      isLock,
      headReviewerId,
      phaseId,
      reviewerIds,
      preThesisTitle,
      mainThesisTitle,
    } = createStudentDto;

    // 학생 존재 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        loginId,
        type: UserType.STUDENT,
      },
    });
    if (foundStudent) {
      throw new BadRequestException("이미 존재하는 학생입니다.");
    }

    // deptId, phaseId, headReviewerId, reviewerIds 올바른지 확인
    const foundDept = await this.prismaService.department.findUnique({
      where: {
        id: deptId,
      },
    });
    if (!foundDept) {
      throw new BadRequestException("해당하는 학과가 없습니다.");
    }

    const foundPhase = await this.prismaService.phase.findUnique({
      where: {
        id: phaseId,
      },
    });
    if (!foundPhase) {
      throw new BadRequestException("해당하는 시스템 단계가 없습니다.");
    }

    if (!reviewerIds.includes(headReviewerId)) {
      throw new BadRequestException("지도교수 리스트에 심사위원장이 포함되어야 합니다.");
    }
    for (const reviewerId of reviewerIds) {
      const foundProfessor = await this.prismaService.user.findUnique({
        where: {
          id: reviewerId,
          type: UserType.PROFESSOR,
        },
      });
      if (!foundProfessor) {
        throw new BadRequestException(`[ID:${reviewerId}]에 해당하는 교수가 없습니다.`);
      }
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        // 사용자(user) 생성
        const user = await tx.user.create({
          data: {
            deptId,
            loginId,
            email,
            password: this.authService.createHash(password),
            name,
            phone,
            type: UserType.STUDENT,
          },
        });

        // 논문 과정(process) 생성
        const process = await tx.process.create({
          data: {
            studentId: user.id,
            headReviewerId,
            phaseId,
            isLock,
          },
        });

        // 지도 교수 배정 (reviewer)
        await tx.reviewer.createMany({
          data: reviewerIds.map((reviewerId) => {
            return { processId: process.id, reviewerId };
          }),
        });

        // 논문 정보 생성 (thesis_info) : 예심 논문 정보, 본심 논문 정보 총 2개 생성
        const preThesisInfo = await tx.thesisInfo.create({
          data: {
            processId: process.id,
            title: preThesisTitle,
            stage: Stage.PRELIMINARY,
            summary: Summary.UNEXAMINED,
          },
        });
        const mainThesisInfo = await tx.thesisInfo.create({
          data: {
            processId: process.id,
            title: mainThesisTitle,
            stage: Stage.MAIN,
            summary: Summary.UNEXAMINED,
          },
        });

        // 논문 파일 생성 (thesis_file) : 각 논문 정보 마다 2개씩(논문 파일, 발표 파일) 생성
        await tx.thesisFile.create({
          data: {
            thesisInfoId: preThesisInfo.id,
            type: ThesisFileType.PRESENTATION,
          },
        });
        await tx.thesisFile.create({
          data: {
            thesisInfoId: preThesisInfo.id,
            type: ThesisFileType.THESIS,
          },
        });
        await tx.thesisFile.create({
          data: {
            thesisInfoId: mainThesisInfo.id,
            type: ThesisFileType.PRESENTATION,
          },
        });
        await tx.thesisFile.create({
          data: {
            thesisInfoId: mainThesisInfo.id,
            type: ThesisFileType.THESIS,
          },
        });

        // 논문 심사 (review) : 각 논문 정보(예심/본심)에 대해 (지도교수들 심사(심사위원장 포함) + 최종심사) 생성
        await tx.review.createMany({
          data: reviewerIds.map((reviewerId) => {
            return {
              thesisInfoId: preThesisInfo.id,
              reviewerId,
              status: ReviewStatus.UNEXAMINED,
            };
          }),
        });
        await tx.review.createMany({
          data: reviewerIds.map((reviewerId) => {
            return {
              thesisInfoId: mainThesisInfo.id,
              reviewerId,
              status: ReviewStatus.UNEXAMINED,
            };
          }),
        });

        // TODO(최종 심사) : 심사위원장의 심사/최종판정 구분 불가능 이슈 해결 후 확정
        /** 
        const preFinalReview = await tx.review.create({
          data: {
            thesisInfoId: preThesisInfo.id,
            reviewerId: headReviewerId,
            status: ReviewStatus.UNEXAMINED,
          },
        });
        const mainFinalReview = await tx.review.create({
          data: {
            thesisInfoId: mainThesisInfo.id,
            reviewerId: headReviewerId,
            status: ReviewStatus.UNEXAMINED,
          },
        });
        */

        return await tx.user.findUnique({
          where: {
            id: user.id,
            type: UserType.STUDENT,
          },
          include: {
            department: true,
            studentProcess: {
              include: {
                phase: true,
              },
            },
          },
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(error.meta?.target);
    }
  }

  async createStudentExcel() {
    return "CREATED STUDENTS";
  }

  async updateStudent() {
    return "UPDATED STUDENT";
  }
}
