import { Service } from 'typedi';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import {
  DeleteResult,
  getRepository,
  InsertResult,
  UpdateResult
} from 'typeorm';
import { User } from '@entities/user.entity';
import { JWTService } from '@services/jwt.service';
import { AuthInterface, UserInterface } from '@interfaces';
import { UserNotFoundError } from '@exception/users/user-not-found.error';
import { HashInvalidError } from '@exception/users/hash-invalid.error';
import { DatabaseError } from '@exception/database.error';
import { UserErrorsMessages } from '@constants/errorMessages';
import { RecoverPassDTO } from '@dto/recoverPassDTO';
import { ResetPassDTO } from '@dto/resetPassDTO';
import { IEmail } from 'src/interfaces/email/email.interface';
import { EmailService } from './email.service';
import crypto from 'crypto';
import { checkHashIsExpired } from '@utils';

@Service()
export class UsersService {
  constructor(private readonly jwtService: JWTService) { }

  private readonly userRepository = getRepository<User>(User);

  comparePassword(input: AuthInterface.IComparePasswordInput): boolean {
    const { password, userPassword } = input;
    return compareSync(password, userPassword);
  }

  async generateToken(user: User): Promise<string> {
    return this.jwtService.createJWT(user);
  }

  hashPassword(password: string): string {
    return hashSync(password, genSaltSync());
  }

  hashUserPassword(user: User): void {
    user.password = this.hashPassword(user.password);
  }

  listUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async showUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new UserNotFoundError( );
    }
    return user;
  }

  async showUserByHash(verifyHash: string): Promise<User> {
    const user = await this.userRepository.findOne({ verifyHash });
    if (!user) {
      throw new HashInvalidError( );
    }
    return user;
  }

  async getUserByFBIDOrEmail(facebookID: string, email: string): Promise<User> {
    const user = await this.userRepository.findOne(
      { where:
        [{ facebookID }, { email }]
      });
    if ( !user ) {
      throw new UserNotFoundError();
    }
    return user;
  }

  async showUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new UserNotFoundError( );
    }
    return user;
  }

  async showUserByEmailAndPassswordHash(
    email: string, passwordHash: string
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email, passwordHash } });
    if (!user) {
      throw new UserNotFoundError( );
    }
    return user;
  }

  async findOrCreateUserFacebook(userData: User): Promise<User> {
    try {
      let user = await this.getUserByFBIDOrEmail( userData.facebookID, userData.email );
      if ( !user.facebookID ) {
        user.facebookID = userData.facebookID;
        user = await this.save(user);
      }
      return user;
    } catch ( error ) {
      userData.verified = true;
      userData.verifyHash = null;
      userData.verifyHashExpiresAt = null;
      const user = await this.save(userData);
      return user;
    }
  }

  createUser(user: User): Promise<InsertResult> {
    this.hashUserPassword(user);
    return this.userRepository.insert(user);
  }

  editUser(input: UserInterface.IEditUserInput): Promise<UpdateResult> {
    const { id, user } = input;
    return this.userRepository.update(id, user);
  }

  deleteUser(id: number): Promise<DeleteResult> {
    return this.userRepository.delete(id);
  }

  private async save( _user: User ): Promise<User> {
    try {
      const user = await this.userRepository.save( _user );
      return user;
    } catch (error) {
      throw new DatabaseError( `${UserErrorsMessages.USER_NOT_SAVED}: ${error}`);
    }
  }

  async verifyUser(verifyHash: string): Promise<User> {
    const user = await this.showUserByHash(verifyHash);
    checkHashIsExpired( user.verifyHashExpiresAt );
    user.verified = true;
    user.verifyHash = null;
    user.verifyHashExpiresAt = null;
    await this.userRepository.update(user.id, user);
    return user;
  }

  generatePasswordHash( ): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async updateUserPasswordHash( userId: number ): Promise<User> {
    const passwordHash = this.generatePasswordHash( );
    try {
      const user = await User
        .createQueryBuilder()
        .update(User)
        .set(
          { passwordHash: passwordHash,
            // eslint-disable-next-line quotes
            passwordHashExpiresAt: () => `NOW() +INTERVAL '1 day'`
          }
        )
        .where('id = :id', { id: userId })
        .execute();
      return user.raw[0];
    } catch ( error ) {
      throw new DatabaseError( `${UserErrorsMessages.USER_HASH_RECOVER_PASS}: ${error}`);
    }
  }

  async recoverPassword( recoverPassDTO: RecoverPassDTO ): Promise<boolean> {
    const email = recoverPassDTO.email;
    let user = await this.showUserByEmail( email );
    user = await this.updateUserPasswordHash( user.id );
    const emailData: IEmail = {
      from: process.env.EMAIL_SENDER,
      to: email,
      subject: 'Password Recovery',
      text: `Hello ${user.firstName} click on the link below to recover your password.
      <a href="${process.env.HOSTNAME}/recover?key=${user.passwordHash}">
      Recover my password</a>
      `
    };
    return EmailService.sendEmail( emailData );
  }

  async resetPassword( resetData: ResetPassDTO ): Promise<User> {
    const user = await this.showUserByEmailAndPassswordHash(
      resetData.email, resetData.passwordHash
    );
    checkHashIsExpired( user.passwordHashExpiresAt );
    user.password = resetData.password;
    this.hashUserPassword(user);
    return this.save(user);
  }
}
