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
      // const fileName = `${path.basename(
      //   Buffer.from(file.originalname, "latin1").toString("utf8"),
      //   extension
      // )}${Date.now()}${extension}`;
      const fileName = `${path.basename(file.originalname, extension)}_${Date.now()}${extension}`;

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
