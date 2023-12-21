import { Department, Phase, Process, User } from "@prisma/client";

export class StudentDto {
  constructor(
    studentData: User & {
      department: Department;
      studentProcess: Process & { phase: Phase };
    }
  ) {
    this.id = studentData.id;
    this.loginId = studentData.loginId;
    this.password = studentData.password;
    this.name = studentData.name;
    this.email = studentData.email;
    this.phone = studentData.phone;
    this.department = studentData.department;
    // this.phase.id = studentData.studentProcess.phase.id;
    // this.phase.title = studentData.studentProcess.phase.title;
    this.phase = {
      id: studentData.studentProcess.phase.id,
      title: studentData.studentProcess.phase.title,
    };
    this.createdAt = studentData.createdAt;
    this.updatedAt = studentData.updatedAt;
  }

  id: number;
  loginId: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  phase: Partial<Phase>;
  createdAt: Date;
  updatedAt: Date;
}
