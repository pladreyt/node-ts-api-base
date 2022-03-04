import { ErrorsMessages, UserErrorsMessages } from '@constants/errorMessages';
import { Service } from 'typedi';
import { getRepository } from 'typeorm';
import { User } from '@entities/user.entity';
import { UsersService } from '@services/users.service';
import { RedisService } from '@services/redis.service';
import { AuthInterface } from '@interfaces';
import { DatabaseError } from '@exception/database.error';
import { RedisError } from '@exception/redis.error';
import { HttpError } from 'routing-controllers';
import { HttpStatusCode } from '@constants/httpStatusCode';

@Service()
export class SessionService {
  constructor(
    private readonly userService: UsersService,
    private readonly redisService: RedisService
  ) {}

  private readonly userRepository = getRepository<User>(User);

  async signUp(userData: User) {
    this.userService.hashUserPassword(userData);
    try {
      const user = await this.userRepository.save(userData);
      return user;
    } catch (error) {
      throw new DatabaseError(UserErrorsMessages.USER_ALREADY_EXISTS);
    }
  }

  async signIn(input: AuthInterface.ISignInInput) {
    const { email, password } = input;

    let user: User;
    try {
      user = await User.createQueryBuilder('user')
        .innerJoinAndSelect('user.role', 'role')
        .select([
          'user.id',
          'user.password',
          'user.email',
          'user.roleId',
          'role.id',
          'role.name'
        ])
        .where({ email })
        .getOneOrFail();
    } catch (error) {
      throw new HttpError(
        HttpStatusCode.UNAUTHORIZED,
        ErrorsMessages.INVALID_CREDENTIALS
      );
    }

    if (
      !this.userService.comparePassword({
        password,
        userPassword: user.password
      })
    ) {
      throw new HttpError(
        HttpStatusCode.UNAUTHORIZED,
        ErrorsMessages.INVALID_CREDENTIALS
      );
    }

    const token = this.userService.generateToken(user);
    this.userService.hashUserPassword(user);
    return token;
  }

  async authenticateFacebook(userData: User) {
    const user = await this.userService.findOrCreateUserFacebook(userData);
    return this.userService.generateToken(user);
  }

  logOut(input: AuthInterface.ITokenToBlacklistInput): Promise<number> {
    const tokenAddedToBlacklist = this.redisService.addTokenToBlacklist(input);
    if (!tokenAddedToBlacklist) {
      throw new RedisError(ErrorsMessages.REDIS_ERROR_SET_TOKEN);
    }
    return tokenAddedToBlacklist;
  }
}
