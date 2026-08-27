import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// jwt + проверка роли одним декоратором
@Injectable()
export class AdminGuard extends AuthGuard('jwt'){
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const authenticated = await super.canActivate(context) as boolean;
        if(!authenticated) return false;
        const request = context.switchToHttp().getRequest();
        if(request.user?.role !== 'admin'){
            throw new ForbiddenException('Admin only');
        }
        return true;
    }
}
