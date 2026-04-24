import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'danieljatczak backend server is runing now!';
  }
}
