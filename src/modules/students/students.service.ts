import { ThesisInfoQueryDto, ThesisQueryType } from "./dtos/thesis-info-query.dto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserType } from "src/common/enums/user-type.enum";
import { PrismaService } from "src/config/database/prisma.service";
import { StudentSearchPageQuery } from "./dtos/student-search-page-query.dto";
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
import { StudentSearchQuery } from "./dtos/student-search-query.dto";
import { UpdateStudentDto } from "./dtos/update-student.dto";
import { UpdateSystemDto } from "./dtos/update-system.dto";
import { User } from "@prisma/client";
import { UpdateThesisInfoDto } from "./dtos/update-thesis-info.dto";

@Injectable()
export class StudentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

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
              isFinal: false,
            };
          }),
        });
        await tx.review.createMany({
          data: reviewerIds.map((reviewerId) => {
            return {
              thesisInfoId: mainThesisInfo.id,
              reviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            };
          }),
        });
        // 최종 심사
        await tx.review.create({
          data: {
            thesisInfoId: preThesisInfo.id,
            reviewerId: headReviewerId,
            status: ReviewStatus.UNEXAMINED,
            isFinal: true,
          },
        });
        await tx.review.create({
          data: {
            thesisInfoId: mainThesisInfo.id,
            reviewerId: headReviewerId,
            status: ReviewStatus.UNEXAMINED,
            isFinal: true,
          },
        });

        return await tx.user.findUnique({
          where: {
            id: user.id,
            type: UserType.STUDENT,
          },
          include: { department: true },
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(error.meta?.target);
    }
  }

  async createStudentExcel() {
    return "CREATED STUDENTS";
  }

  async getStudentList(studentSearchPageQuery: StudentSearchPageQuery) {
    const { studentNumber, name, email, phone, departmentId, phaseId, isLock } = studentSearchPageQuery;

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
      include: { department: true },
      skip: studentSearchPageQuery.getOffset(),
      take: studentSearchPageQuery.getLimit(),
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

  async getStudentExcel(studentSearchQuery: StudentSearchQuery) {
    const { studentNumber, name, email, phone, departmentId, phaseId, isLock } = studentSearchQuery;

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

      // 시스템 정보
      record["시스템 단계"] = phase.title;
      record["시스템 락 여부"] = process.isLock;

      // 교수 배정 정보
      record["심사위원장"] = headReviewer.name;
      reviewers.forEach((reviewerInfo, index) => {
        record[`심사위원-${index + 1}`] = reviewerInfo.reviewer.name;
      });

      // TODO (제출 상태) : 넣을까 말까.. 솦 졸논에 비슷한 기능이 있는데 행정실에서 먼저 요청하지 않으면 굳이 포함하지 않는 것도 방법일 듯합니다...ㅎ
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

  async getStudent(studentId: number) {
    const student = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: { department: true },
    });
    if (!student) {
      throw new BadRequestException("해당하는 학생을 찾을 수 없습니다.");
    }

    return student;
  }

  async updateStudent(studentId: number, updateStudentDto: UpdateStudentDto) {
    const { loginId, password, name, email, phone, deptId } = updateStudentDto;

    // studentId, deptId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    if (deptId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: {
          id: deptId,
        },
      });
      if (!foundDept) throw new BadRequestException("해당하는 학과가 없습니다.");
    }

    try {
      return await this.prismaService.user.update({
        where: { id: studentId },
        data: {
          loginId: loginId ?? undefined,
          password: password ? this.authService.createHash(password) : undefined,
          name: name ?? undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
          deptId: deptId ?? undefined,
        },
        include: { department: true },
      });
    } catch (error) {
      throw new InternalServerErrorException("학생 정보 업데이트 실패");
    }
  }

  async getStudentSystem(studentId: number) {
    // studentId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");

    return await this.prismaService.process.findUnique({
      where: { studentId },
      include: { phase: true },
    });
  }

  async updateStudentSystem(studentId: number, updateSystemDto: UpdateSystemDto) {
    const { phaseId, isLock } = updateSystemDto;

    // studentId, phaseId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    const foundPhase = await this.prismaService.phase.findUnique({
      where: {
        id: phaseId,
      },
    });
    if (!foundPhase) {
      throw new BadRequestException("해당하는 시스템 단계가 없습니다.");
    }

    try {
      return await this.prismaService.process.update({
        where: { studentId },
        data: {
          phaseId: phaseId ?? undefined,
          isLock: isLock ?? undefined,
        },
        include: { phase: true },
      });
    } catch (error) {
      throw new InternalServerErrorException(`업데이트 실패: ${error.message}`);
    }
  }

  async getThesisInfo(studentId: number, thesisInfoQueryDto: ThesisInfoQueryDto, currentUser: User) {
    const typeQuery = thesisInfoQueryDto.type;
    const currentUserType = currentUser.type;
    const userId = currentUser.id;
    const process = await this.prismaService.process.findUnique({
      where: { studentId },
    });

    // studentId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");

    // 접근 권한 확인
    if (currentUserType === UserType.STUDENT && userId !== studentId) {
      throw new UnauthorizedException("타 학생의 정보는 열람할 수 없습니다.");
    } else if (currentUserType === UserType.PROFESSOR) {
      const foundReviewer = await this.prismaService.reviewer.findFirst({
        where: { reviewerId: userId, processId: process.id },
      });
      if (!foundReviewer) throw new UnauthorizedException("비지도 학생의 정보는 열람할 수 없습니다.");
    }

    // 조회할 심사 단계 결정
    let stage;
    if (typeQuery === ThesisQueryType.NOW) {
      // 학생의 현재 시스템 단계 확인
      /**
       * phaseId 1, 2 > 예심
       * phaseId 3, 4, 5 > 본심
       */
      stage = process.phaseId in [1, 2] ? Stage.PRELIMINARY : Stage.MAIN;
    } else {
      stage = typeQuery === ThesisQueryType.MAIN ? Stage.MAIN : Stage.PRELIMINARY;
    }

    // 정보 조회
    try {
      return this.prismaService.thesisInfo.findFirst({
        where: {
          processId: process.id,
          stage,
        },
        include: {
          process: {
            include: { student: { include: { department: true } } },
          },
          thesisFiles: {
            orderBy: { type: "desc" },
            include: { file: true },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`조회 실패: ${error}}`);
    }
  }

  async updateThesisInfo(studentId: number, updateThesisInfoDto: UpdateThesisInfoDto, currentUser: User) {
    const currentUserType = currentUser.type;
    const { title, abstract, thesisFileUUID, presentationFileUUID } = updateThesisInfoDto;
    const userId = currentUser.id;

    // studentId, thesisFileUUID, presentationFileUUID 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");

    if (thesisFileUUID) {
      const foundThesisFile = await this.prismaService.file.findUnique({
        where: { uuid: thesisFileUUID },
      });
      if (!foundThesisFile) throw new BadRequestException("논문 파일이 존재하지 않습니다.");
    }

    if (presentationFileUUID) {
      const foundPresentationFile = await this.prismaService.file.findUnique({
        where: { uuid: presentationFileUUID },
      });
      if (!foundPresentationFile) throw new BadRequestException("논문 발표 파일이 존재하지 않습니다.");
    }

    // 접근 권한 확인
    if (currentUserType === UserType.STUDENT && userId !== studentId) {
      throw new UnauthorizedException("타 학생의 정보는 수정할 수 없습니다.");
    }
    if (currentUserType === UserType.ADMIN) {
      if (abstract || thesisFileUUID || presentationFileUUID) {
        throw new BadRequestException("관리자는 논문 제목만 수정할 수 있습니다.");
      }
    }

    // 수정할 학생의 현재 심사 단계[예심 or 본심] 정보 가져오기
    const process = await this.prismaService.process.findUnique({
      where: { studentId },
      include: {
        thesisInfos: {
          orderBy: { stage: "asc" },
          include: {
            thesisFiles: {
              orderBy: { type: "asc" },
            },
          },
        },
      },
    });
    const stage = process.phaseId in [1, 2] ? Stage.PRELIMINARY : Stage.MAIN;
    const currentThesisInfo = stage === Stage.PRELIMINARY ? process.thesisInfos[0] : process.thesisInfos[1];
    const currentPresentationFile = currentThesisInfo.thesisFiles[0];
    const currentThesisFile = currentThesisInfo.thesisFiles[1];

    // 업데이트 진행
    try {
      return await this.prismaService.thesisInfo.update({
        where: { id: currentThesisInfo.id },
        data: {
          title: title ?? undefined,
          abstract: abstract ?? undefined,
          thesisFiles: {
            update: [
              {
                where: { id: currentPresentationFile.id },
                data: { fileId: presentationFileUUID ?? undefined },
              },
              {
                where: { id: currentThesisFile.id },
                data: { fileId: thesisFileUUID ?? undefined },
              },
            ],
          },
        },
        include: {
          process: {
            include: { student: { include: { department: true } } },
          },
          thesisFiles: {
            orderBy: { type: "desc" },
            include: { file: true },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`업데이트 실패: ${error}`);
    }
  }
}
