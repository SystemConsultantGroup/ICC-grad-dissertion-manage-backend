import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { defaultIfEmpty, map } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    const req: Request = _context.switchToHttp().getRequest();

    const excludePaths = ["/api/capa-metrics", "/capa-metrics"];

    return next
      .handle()
      .pipe(defaultIfEmpty(null))
      .pipe(
        map((result) => {
          if (!excludePaths.includes(req.url)) {
            return result;
          }
        })
      );
  }
}
