import { ReviewerRoleQuery, UpdateReviewerQueryDto } from "./dtos/update-reviewer-query-dto";
import { ThesisInfoQueryDto, ThesisQueryType } from "./dtos/thesis-info-query.dto";
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { UserType } from "src/common/enums/user-type.enum";
import { PrismaService } from "src/config/database/prisma.service";
import { StudentSearchPageQuery } from "./dtos/student-search-page-query.dto";
import * as XLSX from "xlsx";
import * as DateUtil from "../../common/utils/date.util";
import { CreateStudentDto } from "./dtos/create-student.dto";
import { AuthService } from "../auth/auth.service";
import { Stage } from "src/common/enums/stage.enum";
import { Summary } from "src/common/enums/summary.enum";
import { ThesisFileType } from "src/common/enums/thesis-file-type.enum";
import { ReviewStatus } from "src/common/enums/review-status.enum";
import { StudentSearchQuery } from "./dtos/student-search-query.dto";
import { UpdateStudentDto } from "./dtos/update-student.dto";
import { UpdateSystemDto } from "./dtos/update-system.dto";
import { User, Role } from "@prisma/client";
import { validate } from "class-validator";
import { UpdateThesisInfoDto } from "./dtos/update-thesis-info.dto";
import { Readable } from "stream";

@Injectable()
export class StudentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

  // 학생 생성 API
  async createStudent(createStudentDto: CreateStudentDto) {
    const {
      loginId,
      password,
      name,
      email,
      phone,
      deptId,
      headReviewerId,
      stage,
      advisorIds,
      committeeIds,
      thesisTitle,
    } = createStudentDto;

    // 로그인 아이디, 이메일 존재 여부 확인
    const foundId = await this.prismaService.user.findUnique({
      where: { loginId },
    });
    if (foundId)
      throw new BadRequestException("이미 존재하는 아이디입니다. 기존 학생 수정은 학생 수정 페이지를 이용해주세요.");
    const foundEmail = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (foundEmail) throw new BadRequestException("이미 존재하는 이메일입니다.");

    // deptId, headReviewerId, advisorIds, committeeIds 올바른지 확인
    const foundDept = await this.prismaService.department.findUnique({
      where: { id: deptId },
    });
    if (!foundDept) throw new BadRequestException("해당하는 학과가 없습니다.");
    const foundHeadReviewer = await this.prismaService.user.findUnique({
      where: { id: headReviewerId, type: UserType.PROFESSOR },
    });
    if (!foundHeadReviewer) throw new BadRequestException(`[ID:${headReviewerId}]에 해당하는 교수가 없습니다.`);
    for (const reviewerId of advisorIds) {
      const foundProfessor = await this.prismaService.user.findUnique({
        where: {
          id: reviewerId,
          type: UserType.PROFESSOR,
        },
      });
      if (!foundProfessor) throw new BadRequestException(`[ID:${reviewerId}]에 해당하는 교수가 없습니다.`);
    }
    for (const reviewerId of committeeIds) {
      const foundProfessor = await this.prismaService.user.findUnique({
        where: {
          id: reviewerId,
          type: UserType.PROFESSOR,
        },
      });
      if (!foundProfessor) throw new BadRequestException(`[ID:${reviewerId}]에 해당하는 교수가 없습니다.`);
    }
    const reviewerIds = [headReviewerId, ...advisorIds, ...committeeIds];

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
            phaseId: stage === Stage.PRELIMINARY ? 1 : 4, // 1: 예심 논문 제출, 4: 본심 논문 제출
            stage,
          },
        });

        // 심사위원장, 지도교수, 심사위원 배정
        await tx.reviewer.createMany({
          data: [
            // 심사위원장
            { processId: process.id, reviewerId: headReviewerId, role: Role.COMMITTEE_CHAIR },
            // 심사위원
            ...committeeIds.map((committeeId) => {
              return { processId: process.id, reviewerId: committeeId, role: Role.COMMITTEE_MEMBER };
            }),
            // 지도교수
            ...advisorIds.map((advisorId) => {
              return { processId: process.id, reviewerId: advisorId, role: Role.ADVISOR };
            }),
          ],
        });

        // 논문 정보 생성 (thesis_info) : 예심 논문 정보, 본심 논문 정보, 수정지시사항 총 3개 생성
        const preThesisInfo = await tx.thesisInfo.create({
          data: {
            processId: process.id,
            title: stage === Stage.PRELIMINARY ? thesisTitle : null,
            stage: Stage.PRELIMINARY,
            summary: Summary.UNEXAMINED,
            thesisFiles: {
              create: [{ type: ThesisFileType.PRESENTATION }, { type: ThesisFileType.THESIS }],
            },
          },
        });
        const mainThesisInfo = await tx.thesisInfo.create({
          data: {
            processId: process.id,
            title: stage === Stage.MAIN ? thesisTitle : null,
            stage: Stage.MAIN,
            summary: Summary.UNEXAMINED,
            thesisFiles: {
              create: [{ type: ThesisFileType.PRESENTATION }, { type: ThesisFileType.THESIS }],
            },
          },
        });
        const revisionThesisInfo = await tx.thesisInfo.create({
          data: {
            processId: process.id,
            stage: Stage.REVISION,
            summary: Summary.UNEXAMINED,
            thesisFiles: {
              create: [{ type: ThesisFileType.REVISION_REPORT }, { type: ThesisFileType.THESIS }],
            },
          },
        });

        // 논문 심사 (review)
        await tx.review.createMany({
          data: [
            // 예심 논문 심사
            ...reviewerIds.map((reviewerId) => {
              return {
                thesisInfoId: preThesisInfo.id,
                reviewerId,
                status: ReviewStatus.UNEXAMINED,
                isFinal: false,
              };
            }),
            // 예심 최종 심사
            {
              thesisInfoId: preThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: true,
            },
            // 본심 논문 심사
            ...reviewerIds.map((reviewerId) => {
              return {
                thesisInfoId: mainThesisInfo.id,
                reviewerId,
                status: ReviewStatus.UNEXAMINED,
                isFinal: false,
              };
            }),
            // 본심 최종 심사
            {
              thesisInfoId: mainThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: true,
            },
            // 수정지시사항 확인
            ...reviewerIds.map((reviewerId) => {
              return {
                thesisInfoId: revisionThesisInfo.id,
                reviewerId,
                status: ReviewStatus.UNEXAMINED,
                isFinal: false,
              };
            }),
          ],
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
      console.log(error);
      throw new InternalServerErrorException("학생 생성 실패");
    }
  }

  async createStudentExcel(excelFile: Express.Multer.File) {
    if (!excelFile) throw new BadRequestException("파일을 업로드해주세요.");
    const workBook = XLSX.read(excelFile.buffer, { type: "buffer" });
    const sheetName = workBook.SheetNames[0];
    const sheet = workBook.Sheets[sheetName];
    const studentRecords = XLSX.utils.sheet_to_json(sheet);

    return await this.prismaService.$transaction(
      async (tx) => {
        const students = [];
        for (const [index, studentRecord] of studentRecords.entries()) {
          try {
            // 모든 항목 값 받아오기
            const studentNumber = studentRecord["학번"]?.toString();
            const password = studentRecord["비밀번호"]?.toString();
            const name = studentRecord["이름"];
            const email = studentRecord["이메일"];
            const phone = studentRecord["연락처"]?.toString();
            const major = studentRecord["전공"];
            const phase = studentRecord["심사과정"];
            const thesisTitle = studentRecord["작품/논문 제목"];
            const advisor1 = studentRecord["지도 교수1"];
            const advisor2 = studentRecord["지도 교수2"];
            const committee1 = studentRecord["심사위원1"];
            const committee2 = studentRecord["심사위원2"];
            const headReviewer = studentRecord["심사위원장"];

            // major, phase, headReviewer, reviewers 적절한 값으로 변경
            let deptId,
              phaseId,
              isLock,
              headReviewerId,
              reviewerIds,
              stage,
              advisor1Id,
              advisor2Id,
              committee1Id,
              committee2Id;
            if (major) {
              const foundDepartment = await this.prismaService.department.findFirst({
                where: { name: major },
              });
              if (!foundDepartment) throw new BadRequestException(`${index + 2} 행의 학과 명을 확인해주세요.`);
              deptId = foundDepartment.id;
            }
            if (phase) {
              // 예심 | 본심
              if (phase === "예심") {
                stage = Stage.PRELIMINARY;
                phaseId = 1; // 예심 논문 제출 단계
              } else if (phase === "본심") {
                stage = Stage.MAIN;
                phaseId = 4; // 본심 논문 제출 단계
              } else {
                throw new BadRequestException(`${index + 2} 행의 심사과정 명을 확인해주세요.`);
              }
            }
            if (advisor1) {
              const foundProfessor = await this.prismaService.user.findMany({
                where: { name: advisor1 },
              });
              if (foundProfessor.length === 0)
                throw new BadRequestException(`${index + 2}행의 지도 교수1 이름이 존재하지 않습니다.`);
              else if (foundProfessor.length > 1)
                throw new BadRequestException(`${index + 2}행의 지도 교수1 항목의 이름을 가진 교수가 2명 이상입니다.`);
              else advisor1Id = foundProfessor[0].id;
            }
            if (advisor2) {
              const foundProfessor = await this.prismaService.user.findMany({
                where: { name: advisor2 },
              });
              if (foundProfessor.length === 0)
                throw new BadRequestException(`${index + 2}행의 지도 교수2 이름이 존재하지 않습니다.`);
              else if (foundProfessor.length > 1)
                throw new BadRequestException(`${index + 2}행의 지도 교수2 항목의 이름을 가진 교수가 2명 이상입니다.`);
              else advisor2Id = foundProfessor[0].id;
            }
            if (committee1) {
              const foundProfessor = await this.prismaService.user.findMany({
                where: { name: committee1 },
              });
              if (foundProfessor.length === 0)
                throw new BadRequestException(`${index + 2}행의 심사위원1 이름이 존재하지 않습니다.`);
              else if (foundProfessor.length > 1)
                throw new BadRequestException(`${index + 2}행의 심사위원1 항목의 이름을 가진 교수가 2명 이상입니다.`);
              else committee1Id = foundProfessor[0].id;
            }
            if (committee2) {
              const foundProfessor = await this.prismaService.user.findMany({
                where: { name: committee2 },
              });
              if (foundProfessor.length === 0)
                throw new BadRequestException(`${index + 2}행의 심사위원2 이름이 존재하지 않습니다.`);
              else if (foundProfessor.length > 1)
                throw new BadRequestException(`${index + 2}행의 심사위원2 항목의 이름을 가진 교수가 2명 이상입니다.`);
              else committee2Id = foundProfessor[0].id;
            }
            if (headReviewer) {
              const foundProfessor = await this.prismaService.user.findMany({
                where: { name: headReviewer },
              });
              if (foundProfessor.length === 0)
                throw new BadRequestException(`${index + 2}행의 심사위원장 이름이 존재하지 않습니다.`);
              else if (foundProfessor.length > 1)
                throw new BadRequestException(`${index + 2}행의 심사위원장 항목의 이름을 가진 교수가 2명 이상입니다.`);
              else headReviewerId = foundProfessor[0].id;
            }

            // 학번으로 기존 학생 여부 판단
            if (!studentNumber) throw new BadRequestException(`${index + 2}번째 행의 [학번] 항목을 다시 확인해주세요.`);
            const foundStudent = await this.prismaService.user.findUnique({
              where: {
                loginId: studentNumber,
                type: UserType.STUDENT,
              },
            });

            if (foundStudent) {
              // 학생 업데이트

              // 학생 기본 정보
              const updateStudentDto = new UpdateStudentDto();
              updateStudentDto.password = password;
              updateStudentDto.name = name;
              updateStudentDto.email = email;
              updateStudentDto.phone = phone;
              updateStudentDto.deptId = deptId;
              // 학생 시스템 정보
              const updateSystemDto = new UpdateSystemDto();
              updateSystemDto.phaseId = phaseId;
              // 학생 논문 정보
              const updateThesisInfoDto = new UpdateThesisInfoDto();
              updateThesisInfoDto.title = thesisTitle;

              // Dto 이용 validation 진행
              const dtos = [updateStudentDto, updateStudentDto, updateThesisInfoDto];
              for (const dto of dtos) {
                const validationErrors = await validate(dto);
                if (validationErrors.length > 0) {
                  validationErrors.map((error) => console.log(error.constraints));
                  throw new BadRequestException(`${index + 2} 행의 데이터 입력 형식이 잘못되었습니다.`);
                }
              }

              // 학생 기본 정보 업데이트
              // 이메일 중복 여부 확인
              if (updateStudentDto.email) {
                const foundEmail = await this.prismaService.user.findUnique({
                  where: { email: updateStudentDto.email },
                });
                if (foundEmail && foundEmail.id !== foundStudent.id)
                  throw new BadRequestException(`${index + 2}행 : 이미 존재하는 이메일로는 변경할 수 없습니다.`);
              }

              const updatedStudent = await tx.user.update({
                where: { id: foundStudent.id },
                data: {
                  loginId: updateStudentDto.loginId ?? undefined,
                  password: updateStudentDto.password
                    ? this.authService.createHash(updateStudentDto.password)
                    : undefined,
                  name: updateStudentDto.name ?? undefined,
                  email: updateStudentDto.email ?? undefined,
                  phone: updateStudentDto.phone ?? undefined,
                  deptId: updateStudentDto.deptId ?? undefined,
                },
                include: { department: true },
              });
              // 학생 시스템 정보 업데이트
              const process = await tx.process.update({
                where: { studentId: foundStudent.id },
                data: {
                  phaseId: updateSystemDto.phaseId ?? undefined,
                },
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
              // 학생 논문 정보 업데이트
              const stage = [1, 2].includes(process.phaseId) ? Stage.PRELIMINARY : Stage.MAIN;
              const currentThesisInfo = stage === Stage.PRELIMINARY ? process.thesisInfos[0] : process.thesisInfos[1];
              await tx.thesisInfo.update({
                where: { id: currentThesisInfo.id },
                data: {
                  title: updateThesisInfoDto.title ?? undefined,
                },
              });

              students.push(updatedStudent);
            } else {
              // 신규 학생 생성

              // 모든 항목이 채워져 있는지 확인
              if (Object.keys(studentRecord).length !== 11)
                throw new BadRequestException(`${index + 2} 행의 모든 칸이 채워져야 합니다.`);

              // 엑셀 입력 값을 적절한 값으로 맵핑
              const createStudentDto = new CreateStudentDto();
              createStudentDto.loginId = studentNumber;
              createStudentDto.password = password;
              createStudentDto.name = name;
              createStudentDto.email = email;
              createStudentDto.phone = phone;
              createStudentDto.deptId = deptId;
              // createStudentDto.isLock = isLock;
              createStudentDto.headReviewerId = headReviewerId;
              // createStudentDto.phaseId = phaseId;
              // createStudentDto.reviewerIds = reviewerIds;
              createStudentDto.thesisTitle = thesisTitle;

              // CreateStudentDto 이용 validation 진행
              const validationErrors = await validate(createStudentDto);
              if (validationErrors.length > 0) {
                validationErrors.map((error) => console.log(error.constraints));
                throw new BadRequestException(`${index + 2} 행의 데이터 입력 형식이 잘못되었습니다.`);
              }

              // 이메일 존재 여부 확인
              const foundEmail = await this.prismaService.user.findUnique({
                where: { email: createStudentDto.email },
              });
              if (foundEmail) throw new BadRequestException(`${index + 2}행 : 이미 존재하는 이메일입니다.`);

              // 신규 학생 생성
              // 사용자(user) 생성
              const user = await tx.user.create({
                data: {
                  deptId: createStudentDto.deptId,
                  loginId: createStudentDto.loginId,
                  email: createStudentDto.email,
                  password: this.authService.createHash(createStudentDto.password),
                  name: createStudentDto.name,
                  phone: createStudentDto.phone,
                  type: UserType.STUDENT,
                },
                include: { department: true },
              });
              // 논문 과정(process) 생성
              // TODO : 예심 본심 구분 로직 추가
              const process = await tx.process.create({
                data: {
                  studentId: user.id,
                  headReviewerId: createStudentDto.headReviewerId,
                  phaseId: 1, // TODO : 수정 예정
                  stage: Stage.PRELIMINARY, // TODO : 수정 예정
                },
              });
              // 지도 교수 배정 (reviewer)
              // TODO : 교수 역할 구분
              // await tx.reviewer.createMany({
              //   data: createStudentDto.reviewerIds.map((reviewerId) => {
              //     return { processId: process.id, reviewerId, role: Role.ADVISOR }; // TODO : 수정 예정
              //   }),
              // });
              // 논문 정보 생성 (thesis_info) : 예심 논문 정보, 본심 논문 정보 총 2개 생성
              const preThesisInfo = await tx.thesisInfo.create({
                data: {
                  processId: process.id,
                  title: [1, 2].includes(phaseId) ? createStudentDto.thesisTitle : null,
                  stage: Stage.PRELIMINARY,
                  summary: Summary.UNEXAMINED,
                },
              });
              const mainThesisInfo = await tx.thesisInfo.create({
                data: {
                  processId: process.id,
                  title: [3, 4, 5].includes(phaseId) ? createStudentDto.thesisTitle : null,
                  stage: Stage.MAIN,
                  summary: Summary.UNEXAMINED,
                },
              });
              // 논문 파일 생성 (thesis_file) : 각 논문 정보 마다 2개씩(논문 파일, 발표 파일) 생성
              await tx.thesisFile.createMany({
                data: [
                  {
                    thesisInfoId: preThesisInfo.id,
                    type: ThesisFileType.PRESENTATION,
                  },
                  {
                    thesisInfoId: preThesisInfo.id,
                    type: ThesisFileType.THESIS,
                  },
                  {
                    thesisInfoId: mainThesisInfo.id,
                    type: ThesisFileType.PRESENTATION,
                  },
                  {
                    thesisInfoId: mainThesisInfo.id,
                    type: ThesisFileType.THESIS,
                  },
                ],
              });
              // 논문 심사 (review) : 각 논문 정보(예심/본심)에 대해 (지도교수들 심사(심사위원장 포함) + 최종심사) 생성
              await tx.review.createMany({
                data: [
                  // 예심 논문 심사
                  ...reviewerIds.map((reviewerId) => {
                    return {
                      thesisInfoId: preThesisInfo.id,
                      reviewerId,
                      status: ReviewStatus.UNEXAMINED,
                      isFinal: false,
                    };
                  }),
                  // 본심 논문 심사
                  ...reviewerIds.map((reviewerId) => {
                    return {
                      thesisInfoId: mainThesisInfo.id,
                      reviewerId,
                      status: ReviewStatus.UNEXAMINED,
                      isFinal: false,
                    };
                  }),
                  // 예심 최종 심사
                  {
                    thesisInfoId: preThesisInfo.id,
                    reviewerId: headReviewerId,
                    status: ReviewStatus.UNEXAMINED,
                    isFinal: true,
                  },
                  // 본심 최종 심사
                  {
                    thesisInfoId: mainThesisInfo.id,
                    reviewerId: headReviewerId,
                    status: ReviewStatus.UNEXAMINED,
                    isFinal: true,
                  },
                ],
              });

              students.push(user);
            }
          } catch (error) {
            if (error.status === 400) {
              throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException(`${index + 2} 행에서 에러 발생`);
          }
        }
        return students;
      },
      {
        timeout: 10000,
      }
    );
  }

  // 학생 대량 조회 API
  async getStudentList(studentSearchPageQuery: StudentSearchPageQuery) {
    const { studentNumber, name, email, phone, departmentId } = studentSearchPageQuery;

    if (departmentId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: { id: departmentId },
      });
      if (!foundDept) throw new BadRequestException("해당하는 학과가 없습니다.");
    }

    const students = await this.prismaService.user.findMany({
      where: {
        type: UserType.STUDENT,
        loginId: { contains: studentNumber },
        name: { contains: name },
        email: { contains: email },
        phone: { contains: phone },
        deptId: departmentId,
      },
      include: { department: true, studentProcess: true },
      skip: studentSearchPageQuery.getOffset(),
      take: studentSearchPageQuery.getLimit(),
    });

    const totalCount = await this.prismaService.user.count({
      where: {
        type: UserType.STUDENT,
        loginId: { contains: studentNumber },
        name: { contains: name },
        email: { contains: email },
        phone: { contains: phone },
        deptId: departmentId,
      },
    });

    return { totalCount, students };
  }

  async getStudentExcel(studentSearchQuery: StudentSearchQuery) {
    const { studentNumber, name, email, phone, departmentId } = studentSearchQuery;

    if (departmentId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: { id: departmentId },
      });
      if (!foundDept) throw new BadRequestException("해당하는 학과가 없습니다.");
    }

    const processes = await this.prismaService.process.findMany({
      where: {
        student: {
          type: UserType.STUDENT,
          loginId: { contains: studentNumber },
          name: { contains: name },
          email: { contains: email },
          phone: { contains: phone },
          deptId: departmentId,
        },
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
      const advisors = process.reviewers.filter((reviewer) => reviewer.role === Role.ADVISOR);
      const committees = process.reviewers.filter((reviewer) => reviewer.role === Role.COMMITTEE_MEMBER);
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
      record["본심 논문 제목"] = thesisInfos[1]?.title ? thesisInfos[1].title : "미제출";
      record["본심 심사 상태"] = thesisInfos[1]?.summary ? thesisInfos[1].summary : "미제출";

      // 시스템 정보
      record["시스템 단계"] = phase.title;

      // 교수 배정 정보
      record["심사위원장"] = headReviewer.name;
      advisors.forEach((reviewerInfo, index) => {
        record[`지도 교수${index + 1}`] = reviewerInfo.reviewer.name;
      });
      committees.forEach((reviewerInfo, index) => {
        record[`심사위원${index + 1}`] = reviewerInfo.reviewer.name;
      });

      return record;
    });
    if (!records.length) {
      const record = {};
      record["검색된 학생이 없습니다."] = "";
      records.push(record);
    }

    // 엑셀 데이터 생성
    const workSheet = XLSX.utils.json_to_sheet(records);
    const workBook = XLSX.utils.book_new();
    const fileName = "student_list_" + DateUtil.getCurrentTime().fullDateTime + ".xlsx";
    XLSX.utils.book_append_sheet(workBook, workSheet, "학생 목록");

    const stream = new Readable();
    stream.push(await XLSX.write(workBook, { type: "buffer" }));
    stream.push(null);

    return { fileName, stream };
  }

  // 학생 기본 정보 조회/수정 API
  async getStudent(studentId: number) {
    const student = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: { department: true, studentProcess: true },
    });
    if (!student) {
      throw new BadRequestException("해당하는 학생을 찾을 수 없습니다.");
    }

    return student;
  }

  async updateStudent(studentId: number, updateStudentDto: UpdateStudentDto) {
    const { loginId, password, name, email, phone, deptId } = updateStudentDto;

    // studentId, deptId, loginId, email 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    if (deptId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: { id: deptId },
      });
      if (!foundDept) throw new BadRequestException("해당하는 학과가 없습니다.");
    }
    if (email) {
      const foundEmail = await this.prismaService.user.findUnique({
        where: { email },
      });
      if (foundEmail) throw new BadRequestException("이미 존재하는 이메일입니다.");
    }
    if (loginId) {
      const foundLoginId = await this.prismaService.user.findUnique({
        where: { loginId },
      });
      if (foundLoginId) throw new BadRequestException("이미 존재하는 로그인 아이디 입니다.");
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

  // 학생 시스템 정보 조회/수정 API
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
    const { phaseId } = updateSystemDto;

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
    if (!foundPhase) throw new BadRequestException("해당하는 시스템 단계가 없습니다.");

    try {
      return await this.prismaService.process.update({
        where: { studentId },
        data: {
          phaseId: phaseId ?? undefined,
        },
        include: { phase: true },
      });
    } catch (error) {
      throw new InternalServerErrorException("업데이트 실패");
    }
  }

  // 학생 논문 정보 조회/수정 API
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
      include: { studentProcess: true },
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
    switch (typeQuery) {
      case ThesisQueryType.NOW:
        stage = foundStudent.studentProcess.stage;
        break;
      case ThesisQueryType.MAIN:
        stage = Stage.MAIN;
        break;
      case ThesisQueryType.PRELIMINARY:
        stage = Stage.PRELIMINARY;
        break;
      case ThesisQueryType.REVISION:
        stage = Stage.REVISION;
        break;
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
            include: { file: true },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException("조회 실패");
    }
  }

  async updateThesisInfo(studentId: number, updateThesisInfoDto: UpdateThesisInfoDto, currentUser: User) {
    const currentUserType = currentUser.type;
    const { title, abstract, thesisFileUUID, presentationFileUUID, revisionReportFileUUID } = updateThesisInfoDto;
    const userId = currentUser.id;

    // studentId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: { studentProcess: true },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    const currentStage = foundStudent.studentProcess.stage;

    // 접근 권한 확인
    if (currentUserType === UserType.STUDENT && userId !== studentId) {
      throw new UnauthorizedException("타 학생의 정보는 수정할 수 없습니다.");
    }

    // 제출할 파일 종류 확인
    if (
      (currentStage !== Stage.REVISION && revisionReportFileUUID) ||
      (currentStage === Stage.REVISION && presentationFileUUID)
    ) {
      // 수정지시사항 단계가 아닌데 수정지시사항보고서 제출 or 수정지시사항 단계에 논문 발표 파일 제출
      throw new BadRequestException(`${currentStage}단계에 올바르지 않은 파일 제출입니다.`);
    }

    // 파일 존재 여부 확인
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
    if (revisionReportFileUUID) {
      const revisionReportFile = await this.prismaService.file.findUnique({
        where: { uuid: revisionReportFileUUID },
      });
      if (!revisionReportFile) throw new BadRequestException("수정지시사항 보고서 파일이 존재하지 않습니다.");
    }

    // 수정할 학생의 현재 심사 단계 정보 가져오기
    const process = await this.prismaService.process.findUnique({
      where: { studentId },
      include: {
        thesisInfos: {
          where: { stage: currentStage },
          include: { thesisFiles: true },
        },
      },
    });
    // 업데이트에 파일 id 를 사용하기 위해 미리 불러옴
    const newFileQuery = []; // 파일 업데이트에 쓰일 쿼리 배열
    const currentThesisInfo = process.thesisInfos[0];
    if (thesisFileUUID) {
      const currentThesisFile = currentThesisInfo.thesisFiles.find((file) => file.type === ThesisFileType.THESIS);
      newFileQuery.push({ where: { id: currentThesisFile.id }, data: { fileId: thesisFileUUID } });
    }
    if (presentationFileUUID) {
      const currentPPTFile = currentThesisInfo.thesisFiles.find((file) => file.type === ThesisFileType.PRESENTATION);
      newFileQuery.push({ where: { id: currentPPTFile.id }, data: { fileId: presentationFileUUID } });
    }
    if (revisionReportFileUUID) {
      const currentRevisionFile = currentThesisInfo.thesisFiles.find(
        (file) => file.type === ThesisFileType.REVISION_REPORT
      );
      newFileQuery.push({ where: { id: currentRevisionFile.id }, data: { fileId: revisionReportFileUUID } });
    }

    // 업데이트 진행
    try {
      return await this.prismaService.thesisInfo.update({
        where: { id: currentThesisInfo.id },
        data: {
          title,
          abstract,
          thesisFiles: {
            update: newFileQuery,
          },
        },
        include: {
          process: {
            include: { student: { include: { department: true } } },
          },
          thesisFiles: {
            include: { file: true },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("업데이트 실패");
    }
  }

  // 학생 지도 정보 조회/수정 API
  async getReviewerList(studentId: number) {
    // studentId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");

    const process = await this.prismaService.process.findUnique({
      where: { studentId },
      include: {
        headReviewer: { include: { department: true } },
        reviewers: { include: { reviewer: { include: { department: true } } } },
      },
    });
    const headReviewer = process.headReviewer;
    const advisors = process.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.ADVISOR)
      .map((reviewerInfo) => reviewerInfo.reviewer);

    const committees = process.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.COMMITTEE_MEMBER)
      .map((reviewerInfo) => reviewerInfo.reviewer);

    return { headReviewer, advisors, committees };
  }

  async updateReviewer(studentId: number, reviewerId: number, updateReviewerQuery: UpdateReviewerQueryDto) {
    const roleQuery = updateReviewerQuery.role;
    const role = roleQuery === ReviewerRoleQuery.ADVISOR ? Role.ADVISOR : Role.COMMITTEE_MEMBER;

    // studentId, reviewerId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: {
        studentProcess: {
          include: {
            thesisInfos: true,
          },
        },
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    const foundProfessor = await this.prismaService.user.findUnique({
      where: {
        id: reviewerId,
        type: UserType.PROFESSOR,
      },
    });
    if (!foundProfessor) throw new BadRequestException("존재하지 않는 교수입니다.");

    const process = foundStudent.studentProcess;
    const preThesisInfo = process.thesisInfos.filter((thesisInfo) => thesisInfo.stage === Stage.PRELIMINARY)[0];
    const mainThesisInfo = process.thesisInfos.filter((thesisInfo) => thesisInfo.stage === Stage.MAIN)[0];
    const revisionThesisInfo = process.thesisInfos.filter((thesisInfo) => thesisInfo.stage === Stage.REVISION)[0];

    // 이미 reviewer인 경우
    const foundReviewer = await this.prismaService.reviewer.findFirst({
      where: {
        reviewerId,
        processId: process.id,
      },
    });
    if (foundReviewer) throw new BadRequestException("이미 해당 학생에 배정된 교수입니다.");

    // 인원수 초과 확인
    const currentReviewers = await this.prismaService.reviewer.findMany({
      where: {
        processId: process.id,
        role,
      },
    });
    if (currentReviewers.length === 2) throw new BadRequestException(`${role}가 이미 2명이므로 추가할 수 없습니다.`);

    try {
      await this.prismaService.$transaction(async (tx) => {
        // reviewer 생성
        await tx.reviewer.create({
          data: {
            reviewerId,
            processId: process.id,
            role,
          },
        });
        // review 생성
        await tx.review.createMany({
          data: [
            // 예심 심사
            {
              thesisInfoId: preThesisInfo.id,
              reviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            },
            // 본심 심사
            {
              thesisInfoId: mainThesisInfo.id,
              reviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            },
            // 수정지시사항 반영 확인
            {
              thesisInfoId: revisionThesisInfo.id,
              reviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            },
          ],
        });
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("심사위원장/지도교수 추가 실패");
    }

    // 전체 리뷰어 목록 조회
    const newReviewers = await this.prismaService.process.findUnique({
      where: { studentId },
      include: {
        headReviewer: { include: { department: true } },
        reviewers: { include: { reviewer: { include: { department: true } } } },
      },
    });
    const headReviewer = newReviewers.headReviewer;
    const advisors = newReviewers.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.ADVISOR)
      .map((reviewerInfo) => reviewerInfo.reviewer);
    const committees = newReviewers.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.COMMITTEE_MEMBER)
      .map((reviewerInfo) => reviewerInfo.reviewer);
    return { headReviewer, advisors, committees };
  }

  async deleteReviewer(studentId: number, reviewerId: number) {
    // studentId, reviewerId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: { studentProcess: true },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    const process = foundStudent.studentProcess;
    const foundProfessor = await this.prismaService.user.findUnique({
      where: {
        id: reviewerId,
        type: UserType.PROFESSOR,
      },
    });
    if (!foundProfessor) throw new BadRequestException("존재하지 않는 교수입니다.");

    // 배정된 관계가 맞는지 확인
    const foundReviewer = await this.prismaService.reviewer.findFirst({
      where: {
        reviewerId,
        processId: process.id,
      },
    });
    if (!foundReviewer) throw new BadRequestException("배정 상태인 교수가 아닙니다.");

    // 심사위원장인지 확인
    if (process.headReviewerId === reviewerId) throw new BadRequestException("심사위원장은 배정 취소할 수 없습니다.");

    // 해당 역할의 교수가 2명인지 확인
    const reviewerList = await this.prismaService.reviewer.findMany({
      where: {
        processId: process.id,
        role: foundReviewer.role,
      },
    });
    if (reviewerList.length < 2)
      throw new BadRequestException(`${foundReviewer.role}이 2명일 때만 배정 취소가 가능합니다.`);

    // 배정 취소
    try {
      await this.prismaService.$transaction(async (tx) => {
        // review 삭제
        await tx.review.deleteMany({
          where: {
            reviewerId,
            thesisInfo: {
              is: {
                processId: process.id,
              },
            },
          },
        });
        // reviewer 삭제
        await tx.reviewer.delete({
          where: {
            id: foundReviewer.id,
            processId: process.id,
          },
        });
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("배정 취소 실패");
    }

    // 전체 리뷰어 목록 조회
    const newReviewers = await this.prismaService.process.findUnique({
      where: { studentId },
      include: {
        headReviewer: { include: { department: true } },
        reviewers: { include: { reviewer: { include: { department: true } } } },
      },
    });
    const headReviewer = newReviewers.headReviewer;
    const advisors = newReviewers.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.ADVISOR)
      .map((reviewerInfo) => reviewerInfo.reviewer);
    const committees = newReviewers.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.COMMITTEE_MEMBER)
      .map((reviewerInfo) => reviewerInfo.reviewer);
    return { headReviewer, advisors, committees };
  }

  async updateHeadReviewer(studentId: number, headReviewerId: number) {
    // studentId, headReviewerId 확인
    const foundStudent = await this.prismaService.user.findUnique({
      where: {
        id: studentId,
        type: UserType.STUDENT,
      },
      include: {
        studentProcess: {
          include: {
            thesisInfos: true,
            reviewers: true,
          },
        },
      },
    });
    if (!foundStudent) throw new BadRequestException("존재하지 않는 학생입니다.");
    const foundProfessor = await this.prismaService.user.findUnique({
      where: {
        id: headReviewerId,
        type: UserType.PROFESSOR,
      },
    });
    if (!foundProfessor) throw new BadRequestException("존재하지 않는 교수입니다.");

    const process = foundStudent.studentProcess;
    const preThesisInfo = process.thesisInfos.filter((thesisInfo) => thesisInfo.stage === Stage.PRELIMINARY)[0];
    const mainThesisInfo = process.thesisInfos.filter((thesisInfo) => thesisInfo.stage === Stage.MAIN)[0];
    const revisionThesisInfo = process.thesisInfos.filter((thesisInfo) => thesisInfo.stage === Stage.REVISION)[0];
    const currentHeadReviewer = process.reviewers.filter((reviewer) => reviewer.role === Role.COMMITTEE_CHAIR)[0];

    // 이미 reviewer인 경우
    const foundReviewer = await this.prismaService.reviewer.findFirst({
      where: {
        reviewerId: headReviewerId,
        processId: process.id,
      },
    });
    if (foundReviewer) throw new BadRequestException("이미 해당 학생에 배정된 교수입니다.");

    // 심사위원장 교체
    try {
      await this.prismaService.$transaction(async (tx) => {
        // 기존 심사위원장의 review 삭제
        await tx.review.deleteMany({
          where: {
            reviewerId: currentHeadReviewer.reviewerId,
            thesisInfo: {
              is: {
                processId: process.id,
              },
            },
          },
        });
        // process 수정
        await tx.process.update({
          where: { id: process.id },
          data: { headReviewerId },
        });
        // reviewer 수정
        await tx.reviewer.update({
          where: { id: currentHeadReviewer.id },
          data: { reviewerId: headReviewerId },
        });
        // review 생성
        await tx.review.createMany({
          data: [
            // 예심 심사
            {
              thesisInfoId: preThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            },
            // 예심 최종 심사
            {
              thesisInfoId: preThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: true,
            },
            // 본심 심사
            {
              thesisInfoId: mainThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            },
            // 본심 최종 심사
            {
              thesisInfoId: mainThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: true,
            },
            // 수정지시사항 반영 확인
            {
              thesisInfoId: revisionThesisInfo.id,
              reviewerId: headReviewerId,
              status: ReviewStatus.UNEXAMINED,
              isFinal: false,
            },
          ],
        });
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("심사위원장 교체 실패");
    }

    // 전체 리뷰어 목록 조회
    const newReviewers = await this.prismaService.process.findUnique({
      where: { studentId },
      include: {
        headReviewer: { include: { department: true } },
        reviewers: { include: { reviewer: { include: { department: true } } } },
      },
    });
    const headReviewer = newReviewers.headReviewer;
    const advisors = newReviewers.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.ADVISOR)
      .map((reviewerInfo) => reviewerInfo.reviewer);
    const committees = newReviewers.reviewers
      .filter((reviewerInfo) => reviewerInfo.role === Role.COMMITTEE_MEMBER)
      .map((reviewerInfo) => reviewerInfo.reviewer);
    return { headReviewer, advisors, committees };
  }
}
