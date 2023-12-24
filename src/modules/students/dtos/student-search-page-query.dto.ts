import { IntersectionType } from "@nestjs/swagger";
import { PageQuery } from "src/common/dtos/pagination.dto";
import { StudentSearchQuery } from "./student-search-query.dto";

export class StudentSearchPageQuery extends IntersectionType(StudentSearchQuery, PageQuery) {}
