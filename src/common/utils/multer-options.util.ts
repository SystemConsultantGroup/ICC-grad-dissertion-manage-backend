import * as fs from "fs";
import * as path from "path";
import * as multer from "multer";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

const createFolder = (folder: string) => {
  try {
    fs.mkdirSync(path.join("resources"));
  } catch (error) {}
  try {
    fs.mkdirSync(path.join("resources", folder));
  } catch (error) {}
};

const storage = (folder: string): multer.StorageEngine => {
  createFolder(folder);

  return multer.diskStorage({
    destination(req, file, callback) {
      const folderName = path.join("resources", folder);
      callback(null, folderName);
    },
    filename(req, file, callback) {
      const extension = path.extname(file.originalname);
      const fileName = `${path.basename(
        Buffer.from(file.originalname, "latin1").toString("utf8"),
        extension
      )}${Date.now()}${extension}`;
      // const fileName = `${path.basename(file.originalname, extension)}_${Date.now()}${extension}`;
      // 파일 업로드 환경에 따라서 한글 파일명이 깨질 수 있습니다. 스웨거의 경우 Buffer를 사용해야지 한글 인코딩 성공, 포스트맨은 사용하지 않아야지 인코딩 잘 됨

      callback(null, fileName);
    },
  });
};

export const multerOptions = (folder: string, fileFilter: MulterOptions["fileFilter"]): MulterOptions => {
  return {
    fileFilter,
    storage: storage(folder),
  };
};
