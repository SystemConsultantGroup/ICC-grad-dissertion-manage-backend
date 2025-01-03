import { PrismaClient, UserType } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
async function createHash(password: string) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}
async function main() {
  const admin = await prisma.user.upsert({
    where: { loginId: "admin" },
    update: {},
    create: {
      email: "admin@scg.skku.ac.kr",
      name: "admin",
      loginId: "admin",
      password: await createHash("1234"),
      type: UserType.ADMIN,
      department: {
        create: {
          id: 1,
          name: "어드민학과",
          modificationFlag: true,
        },
      },
    },
  });

  await prisma.phase.createMany({
    data: {
      title: "예심",
      start: "2023-10-05T14:48:00.000Z",
      end: "2025-10-05T14:48:00.000Z"
    }
  })
  console.log({ admin });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
