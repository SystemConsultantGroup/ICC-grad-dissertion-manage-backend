import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserType } from 'src/common/enums/user-type.enum';
import { PrismaService } from 'src/config/database/prisma.service';
import { StudentPageQuery } from './dtos/student-page-query.dto';
import { User } from '@prisma/client';
import { GetStudentExcelQuery } from './dtos/get-student-excel-query.dto';
import * as XLSX from 'xlsx';
import * as DateUtil from '../../common/utils/date.util';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}
  async getStudentList(studentPageQuery: StudentPageQuery) {
    const { studentNumber, name, email, phone, departmentId, phaseId, isLock } =
      studentPageQuery;

    if (departmentId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: {
          id: departmentId,
        },
      });
      if (!foundDept) {
        throw new BadRequestException('해당하는 학과가 없습니다.');
      }
    }
    if (phaseId) {
      const foundPhase = await this.prismaService.phase.findUnique({
        where: {
          id: phaseId,
        },
      });
      if (!foundPhase) {
        throw new BadRequestException('해당하는 학기가 없습니다.');
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
    const { studentNumber, name, email, phone, departmentId, phaseId, isLock } =
      studentExcelQuery;

    if (departmentId) {
      const foundDept = await this.prismaService.department.findUnique({
        where: {
          id: departmentId,
        },
      });
      if (!foundDept) {
        throw new BadRequestException('해당하는 학과가 없습니다.');
      }
    }
    if (phaseId) {
      const foundPhase = await this.prismaService.phase.findUnique({
        where: {
          id: phaseId,
        },
      });
      if (!foundPhase) {
        throw new BadRequestException('해당하는 학기가 없습니다.');
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
        thesisInfos: { orderBy: { stage: 'asc' } },
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
      record['학번'] = student.loginId;
      record['이름'] = student.name;
      record['이메일'] = student.email;
      record['연락처'] = student.phone;
      record['전공'] = dept.name;

      // 학생 논문 정보
      record['예심 논문 제목'] = thesisInfos[0].title
        ? thesisInfos[0].title
        : '미제출';
      record['예심 심사 상태'] = thesisInfos[0].summary;
      record['본심 논문 제목'] = thesisInfos[1].title
        ? thesisInfos[1].title
        : '미제출';
      record['본심 심사 상태'] = thesisInfos[1].summary;

      // 교수 배정 정보
      record['심사위원장'] = headReviewer.name;
      reviewers.forEach((reviewerInfo, index) => {
        record[`심사위원-${index + 1}`] = reviewerInfo.reviewer.name;
      });

      // 시스템 정보
      record['시스템 단계'] = phase.title;
      record['시스템 락 여부'] = process.isLock;

      // 제출 상태 : 넣을까 말까..
      // record['예심 논문 파일 상태'];
      // record['예심 논문 발표 파일 상태'];
      // record['본심 논문 파일 상태'];
      // record['본심 논문 발표 파일 상태'];

      return record;
    });
    if (!records.length) {
      const record = {};
      record['검색된 학생이 없습니다.'] = '';
      records.push(record);
    }

    // 엑셀 데이터 생성
    const excelData = XLSX.utils.json_to_sheet(records);
    const workBook = XLSX.utils.book_new();
    const fileName =
      'student_list_' + DateUtil.getCurrentTime().fullDateTime + '.xlsx';
    const filePath = path.join('resources', 'excel', fileName);

    // `resources/excel`디렉토리에 파일 생성
    XLSX.utils.book_append_sheet(workBook, excelData, 'student_list');
    await XLSX.writeFile(workBook, filePath);

    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath);
      // 파일 삭제
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) return console.log('삭제할 수 없는 파일입니다.');
        fs.unlink(filePath, (err) =>
          err ? console.log(err) : console.log('파일을 삭제했습니다.'),
        );
      });
      return { fileName, stream };
    } else {
      throw new InternalServerErrorException('파일을 생성하지 못했습니다.');
    }
  }

  async getStudent(studentId: number, user: User) {
    if (user.type === UserType.STUDENT && studentId !== user.id) {
      throw new UnauthorizedException('다른 학생의 정보는 조회할 수 없습니다.');
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
      throw new BadRequestException('해당하는 학생을 찾을 수 없습니다.');
    }

    return student;
  }

  async createStudent() {
    return 'CREATED STUDENT';
  }

  async createStudentExcel() {
    return 'CREATED STUDENTS';
  }

  async updateStudent() {
    return 'UPDATED STUDENT';
  }
}
