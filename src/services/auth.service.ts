import { Container, Service } from 'typedi';
import { JWTService } from '@services/jwt.service';
import { RedisService } from '@services/redis.service';
import { Action } from 'routing-controllers';
import { ITokenPayload } from 'src/interfaces/auth/auth.interface';

@Service()
export class AuthorizationService {
  constructor(
    private readonly jwt: JWTService,
    private readonly redis: RedisService
  ) { }
  private static instance: AuthorizationService;
  public static getInstance(): AuthorizationService {
    if (!this.instance) {
      this.instance = Container.get(AuthorizationService);
    }

    return this.instance;
  }

  async getUserFromToken( token: string ): Promise<ITokenPayload | undefined> {
    try {
      if (!token) {
        return undefined;
      }
      if (token.startsWith('Bearer ')) {
        // Remove Bearer from authentication scheme header
        token = token.replace('Bearer ', '');
      }
      const payload = await this.jwt.verifyJWT(token);
      const {
        data: { email }
      } = payload;
      const tokenIsBlacklisted: number = await this.redis.isMemberOfSet({
        email,
        token
      });
      if (!!tokenIsBlacklisted) {
        return undefined;
      }
      return payload;
    } catch (error) {
      // Here we should do something with the error like loggin
      return undefined;
    }
  }

  async authorizationChecker(
    action: Action,
    _roles: string[]
  ): Promise<boolean> {
    const token = action.request.headers['authorization'];
    const valid = await AuthorizationService.instance.getUserFromToken(token);
    return !!valid;
  }

  async currentUserChecker(
    action: Action
  ): Promise<ITokenPayload | undefined> {
    const token = action.request.headers['authorization'];
    const payload = await AuthorizationService.instance.getUserFromToken(token);
    return payload;
  }
}
