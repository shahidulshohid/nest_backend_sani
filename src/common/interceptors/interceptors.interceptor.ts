import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InterceptorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
   const request = context.switchToHttp().getRequest();
    
    
    if (request.body && request.body.data) {
      try {
        request.body.data = JSON.parse(request.body.data);
      } catch (error) {
      }
    }
    
    return next.handle();
  }
}
