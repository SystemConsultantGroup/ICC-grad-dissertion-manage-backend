import { OmitType } from '@nestjs/mapped-types';
import { StudentPageQuery } from './student-page-query.dto';

export class GetStudentExcelQuery extends OmitType(StudentPageQuery, [
  'pageSize',
  'pageNumber',
] as const) {}
