import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  it('should be defined', () => {
    const reflectorMock = new Reflector(); 
    const guard = new RolesGuard(reflectorMock);
    expect(guard).toBeDefined();
  });
});
