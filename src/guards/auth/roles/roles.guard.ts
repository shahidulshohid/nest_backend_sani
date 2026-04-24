import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'generated/prisma/enums';
import { Observable } from 'rxjs';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(private  reflector:Reflector){}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const requiredRole=this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY,[
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRole) return true

    const request=context.switchToHttp().getRequest()


    const user=request.user
  if (!user) throw new ForbiddenException('You are not authenticated.');

     const hasRole = requiredRole.includes(user.role);
     
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return hasRole

  }



}
