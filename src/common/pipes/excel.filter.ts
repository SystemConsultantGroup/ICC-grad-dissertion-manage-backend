import { BadRequestException } from "@nestjs/common";
import { extname } from "path";

const FILE_EXISTENSION = /xls|xlsx/;

export const ExcelFilter = (req, file, callback) => {
  if (!FILE_EXISTENSION.test(extname(file["originalname"]).toLocaleLowerCase())) {
    callback(new BadRequestException("xls 또는 xlsx 파일이 아닙니다"), false);
  } else {
    callback(null, true);
  }
};
