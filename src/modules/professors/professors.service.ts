import { BadRequestException, Injectable } from "@nestjs/common";
import { UserType } from "@prisma/client";
import { PrismaService } from "src/config/database/prisma.service";
import { CreateProfessorDto } from "./dtos/create-professor.dto";
import { AuthService } from "../auth/auth.service";
import { UpdateProfessorDto } from "./dtos/update-professor.dto";
import { ProfessorListPaginationQuery, ProfessorListQuery } from "./dtos/professors-list-query.dto";
import { utils, write } from "xlsx";
import { Readable } from "stream";
import { getCurrentTime } from "src/common/utils/date.util";
import { read } from "xlsx";
import { ProfessorDto } from "./dtos/professor.dto";
import { UploadProfessorDto } from "./dtos/upload-professor.dto";

@Injectable()
export class ProfessorsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

  async getProfessorsList(professorListPaginationQuery: ProfessorListPaginationQuery) {
    const { loginId, name, email, phone, deptId } = professorListPaginationQuery;

    if (deptId) {
      const checkDepartment = await this.prismaService.department.findUnique({
        where: { id: deptId },
      });

      if (!checkDepartment) {
        throw new BadRequestException("존재하지 않는 학과입니다.");
      }
    }
    return await this.prismaService.$transaction(async (tx) => {
      const professors = await tx.user.findMany({
        where: {
          type: UserType.PROFESSOR,
          loginId: { contains: loginId },
          name: { contains: name },
          email: { contains: email },
          phone: { contains: phone },
          deptId: deptId,
        },
        include: {
          department: true,
        },
        skip: professorListPaginationQuery.getOffset(),
        take: professorListPaginationQuery.getLimit(),
      });
      const totalCount = await tx.user.count({
        where: {
          type: UserType.PROFESSOR,
          loginId: { contains: loginId },
          name: { contains: name },
          email: { contains: email },
          phone: { contains: phone },
          deptId: deptId,
        },
      });
      return { totalCount, professors };
    });
  }

  async deleteProfessorsList() {
    return await this.prismaService.user.deleteMany({
      where: { type: UserType.PROFESSOR },
    });
  }

  async createProfessor(createProfessorDto: CreateProfessorDto) {
    const { loginId, password, email, deptId } = createProfessorDto;
    if (!loginId || !password || !email || !deptId) {
      throw new BadRequestException("필수 정보를 입력해주세요.");
    }

    const existingLoginId = await this.prismaService.user.findUnique({
      where: { loginId: loginId },
    });

    if (existingLoginId) {
      throw new BadRequestException("이미 존재하는 아이디입니다.");
    }

    const existingEmail = await this.prismaService.user.findUnique({
      where: { email: email },
    });

    if (existingEmail) {
      throw new BadRequestException("이미 존재하는 이메일입니다.");
    }

    const checkDepartment = await this.prismaService.department.findUnique({
      where: { id: deptId },
    });

    if (!checkDepartment) {
      throw new BadRequestException("존재하지 않는 학과입니다.");
    }

    const hashedPassword = await this.authService.createHash(createProfessorDto.password);

    return await this.prismaService.user.create({
      data: {
        ...createProfessorDto,
        type: UserType.PROFESSOR,
        password: hashedPassword,
      },
      include: {
        department: true,
      },
    });
  }

  async getProfessor(id: number) {
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
      include: {
        department: true,
      },
    });

    if (!professor) {
      throw new BadRequestException("존재하지 않는 교수입니다.");
    }

    return professor;
  }

  async updateProfessor(id: number, updateProfessorDto: UpdateProfessorDto) {
    const { loginId, password, email, deptId } = updateProfessorDto;
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
    });

    if (!professor) throw new BadRequestException("존재하지 않는 교수입니다.");

    if (loginId) {
      const existingLoginId = await this.prismaService.user.findUnique({
        where: { loginId: updateProfessorDto.loginId },
      });
      if (existingLoginId) throw new BadRequestException("이미 존재하는 아이디입니다.");
    }

    if (password) {
      const hashedPassword = await this.authService.createHash(updateProfessorDto.password);
      updateProfessorDto.password = hashedPassword;
    }

    if (email) {
      const existingEmail = await this.prismaService.user.findUnique({
        where: { email: updateProfessorDto.email },
      });

      if (existingEmail) throw new BadRequestException("이미 존재하는 이메일입니다.");
    }

    if (deptId) {
      const checkDepartment = await this.prismaService.department.findUnique({
        where: { id: updateProfessorDto.deptId },
      });

      if (!checkDepartment) throw new BadRequestException("존재하지 않는 학과입니다.");
    }
    return await this.prismaService.user.update({
      where: { id },
      data: updateProfessorDto,
      include: {
        department: true,
      },
    });
  }

  async deleteProfessor(id: number) {
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
    });

    if (!professor) {
      throw new BadRequestException("존재하지 않는 교수입니다.");
    }

    return await this.prismaService.user.delete({
      where: { id },
    });
  }

  async uploadProfessorExcel(excelFile: Express.Multer.File) {
    if (!excelFile) throw new BadRequestException("파일을 업로드해주세요.");

    const workbook = read(excelFile.buffer, { type: "buffer" });

    if (!workbook) throw new BadRequestException("엑셀 파일을 읽을 수 없습니다.");
    if (workbook.SheetNames.length > 1) throw new BadRequestException("엑셀 파일 시트가 1개만 존재해야 합니다.");

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const contents = utils.sheet_to_json(worksheet, { defval: undefined });

    const professors = await contents.map((content) => new UploadProfessorDto(content));

    return await this.prismaService.$transaction(async (tx) => {
      // result 배열 선언 하기
      // result 배열에는 업로드 결과를 담을 예정
      // result 배열을 리턴해주기
      const result = await Promise.all(
        professors.map(async (professor, index) => {
          let user;
          const { loginId, name, password, email, phone, departmentName } = professor;
          if (!loginId) return; // loginId가 없는 경우는 무시
          if (!departmentName) throw new BadRequestException(`${index + 2}번째 줄의 소속학과를 입력해주세요.`);
          if (!email) throw new BadRequestException(`${index + 2}번째 줄의 이메일을 입력해주세요.`);
          if (!name) throw new BadRequestException(`${index + 2}번째 줄의 이름을 입력해주세요.`);

          const dept = await tx.department.findFirst({
            where: { name: departmentName },
            select: { id: true },
          });

          if (!dept) throw new BadRequestException(`${index + 2}번째 줄의 소속학과가 존재하지 않습니다.`);

          // 해당 ID가 존재할 경우 업데이트 진행
          // 없는 경우 생성 진행
          const existingUser = await tx.user.findUnique({
            where: { loginId },
          });

          // 존재하는 유저의 경우
          if (existingUser) {
            // 중복 허용 되는 값은 그냥 다시 넣어줌 (이름, 연락처, 학과, 비밀번호(undefined))
            user = await tx.user.update({
              where: { loginId },
              data: {
                name,
                phone,
                deptId: dept.id,
                password: password ? await this.authService.createHash(password) : undefined,
              },
              include: { department: true },
            });
            // 이메일의 경우 중복 확인 후 진행
            if (existingUser.email !== email) {
              user = await tx.user.update({
                where: { loginId },
                data: { email },
                include: { department: true },
              });
            }
          } else {
            // 존재하지 않는 유저의 경우
            if (!password) throw new BadRequestException(`${index + 2}번째 줄의 비밀번호를 입력해주세요.`);
            console.log(typeof password);
            user = await tx.user.create({
              data: {
                loginId,
                name,
                email,
                phone,
                deptId: dept.id,
                password: await this.authService.createHash(password),
                type: UserType.PROFESSOR,
              },
              include: { department: true },
            });
          }
          return user;
        })
      );
      return result.filter((user) => user !== undefined);
    });
  }

  async downloadProfessorExcel(professListQuery: ProfessorListQuery) {
    const { loginId, name, email, phone, deptId } = professListQuery;
    if (deptId) {
      const checkDepartment = await this.prismaService.department.findUnique({
        where: { id: deptId },
      });

      if (!checkDepartment) {
        throw new BadRequestException("존재하지 않는 학과입니다.");
      }
    }

    const professors = await this.prismaService.user.findMany({
      where: {
        type: UserType.PROFESSOR,
        loginId: { contains: loginId },
        name: { contains: name },
        email: { contains: email },
        phone: { contains: phone },
        deptId: deptId,
      },
      include: {
        department: true,
      },
    });

    if (!professors.length) throw new BadRequestException("조회된 교수가 없습니다.");

    const contents = await professors.map((professor) => new ProfessorDto(professor).converDtoToExcelRecord());
    const worksheet = utils.json_to_sheet(contents);
    const workbook = utils.book_new();
    const filename = "정통대_대학원_교수_목록_" + getCurrentTime().fullDateTime + ".xlsx";
    utils.book_append_sheet(workbook, worksheet, "교수 목록");

    const stream = new Readable();
    stream.push(await write(workbook, { type: "buffer" }));
    stream.push(null);

    return { stream, filename };
  }
}
