import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
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
    try {
      return await this.prismaService.user.deleteMany({
        where: { type: UserType.PROFESSOR },
      });
    } catch (e) {
      throw new InternalServerErrorException("교수 목록 삭제에 실패했습니다.");
    }
  }

  async createProfessor(createProfessorDto: CreateProfessorDto) {
    const { loginId, password, email, deptId } = createProfessorDto;

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

    try {
      return await this.prismaService.user.create({
        data: {
          ...createProfessorDto,
          type: UserType.PROFESSOR,
          password: await this.authService.createHash(password),
        },
        include: {
          department: true,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException("교수 생성에 실패했습니다.");
    }
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
        where: { loginId },
      });
      if (existingLoginId) throw new BadRequestException("이미 존재하는 아이디입니다.");
    }

    if (email) {
      const existingEmail = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (existingEmail) throw new BadRequestException("이미 존재하는 이메일입니다.");
    }

    if (deptId) {
      const checkDepartment = await this.prismaService.department.findUnique({
        where: { id: deptId },
      });

      if (!checkDepartment) throw new BadRequestException("존재하지 않는 학과입니다.");
    }
    try {
      return await this.prismaService.user.update({
        where: { id },
        data: {
          ...updateProfessorDto,
          password: password ? await this.authService.createHash(password) : undefined,
        },
        include: {
          department: true,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException("교수 정보 수정에 실패했습니다.");
    }
  }

  async deleteProfessor(id: number) {
    const professor = await this.prismaService.user.findUnique({
      where: { id, type: UserType.PROFESSOR },
    });

    if (!professor) {
      throw new BadRequestException("존재하지 않는 교수입니다.");
    }
    try {
      return await this.prismaService.user.delete({
        where: { id },
      });
    } catch (e) {
      throw new InternalServerErrorException("교수 삭제에 실패했습니다.");
    }
  }

  async uploadProfessorExcel(excelFile: Express.Multer.File) {
    if (!excelFile) throw new BadRequestException("파일을 업로드해주세요.");

    const workbook = read(excelFile.buffer, { type: "buffer" });

    if (!workbook) throw new BadRequestException("엑셀 파일을 읽을 수 없습니다.");
    if (workbook.SheetNames.length > 1) throw new BadRequestException("엑셀 파일 시트가 1개만 존재해야 합니다.");

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const contents = utils.sheet_to_json(worksheet, { defval: undefined });

    // professor 객체 중 loginId가 없는 경우 제거
    const professors = await contents
      .map((content) => new UploadProfessorDto(content))
      .filter((professor) => professor.loginId);

    if (!professors.length) throw new BadRequestException("업로드할 교수가 없습니다.");

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const result = await Promise.all(
          professors.map(async (professor, index) => {
            const { loginId, name, password, email, phone, departmentName } = professor;

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

            // 해당 이메일 존재 여부 확인
            const existingEmail = await tx.user.findUnique({
              where: { email },
            });

            // 존재하는 유저의 경우
            if (existingUser) {
              // 이메일의 경우 중복이 아닐 경우 업데이트
              if (!existingEmail) {
                await tx.user.update({
                  where: { loginId },
                  data: { email },
                });
              } else if (existingEmail.loginId !== loginId) {
                throw new BadRequestException(`${index + 2}번째 줄의 이메일은 다른 유저가 사용 중입니다.`);
              }
              // 중복 허용 되는 값은 그냥 다시 넣어줌 (이름, 연락처, 학과, 비밀번호(undefined))
              return await tx.user.update({
                where: { loginId },
                data: {
                  name,
                  phone,
                  deptId: dept.id,
                  password: password ? await this.authService.createHash(password) : undefined,
                },
                include: { department: true },
              });
            } else {
              // 새로 생성하는 유저
              if (!departmentName) throw new BadRequestException(`${index + 2}번째 줄의 소속학과를 입력해주세요.`);
              if (!phone) throw new BadRequestException(`${index + 2}번째 줄의 연락처를 입력해주세요`);
              if (!email) throw new BadRequestException(`${index + 2}번째 줄의 이메일을 입력해주세요.`);
              if (!name) throw new BadRequestException(`${index + 2}번째 줄의 이름을 입력해주세요.`);
              if (!password) throw new BadRequestException(`${index + 2}번째 줄의 비밀번호를 입력해주세요.`);

              return await tx.user.create({
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
          })
        );
        return result;
      });
    } catch (error) {
      if (error.status === 400) throw new BadRequestException(error.message);
      else throw new InternalServerErrorException("엑셀 파일 업로드에 실패했습니다.");
    }
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
