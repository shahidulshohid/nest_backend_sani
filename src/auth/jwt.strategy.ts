import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(private configService: ConfigService){ 
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_ACCESS_SECRET")as string
        })
    }

    async validate(payload: any) {

      
                if (!payload.userId) {
            throw new UnauthorizedException("invilite token !");
        }

        return { 
            userId: payload.userId, 
            username: payload.fullName,
            email: payload.email,
            role: payload.role,
            isVerified:payload.isVerified
        };
    }
}