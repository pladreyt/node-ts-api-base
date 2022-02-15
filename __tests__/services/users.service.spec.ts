/* eslint-disable max-len */
import { Container } from 'typedi';
import { genSaltSync, hashSync } from 'bcrypt';
import { UsersService } from '@services/users.service';
import { factory } from 'typeorm-seeding';
import { User } from '@entities/user.entity';
import { getCustomRepository } from 'typeorm';
import { mockUpdateResult, mockUserRepository } from '../utils/mocks';
import { HashInvalidError } from '@exception/users/hash-invalid.error';
import { HashExpiredError } from '@exception/users/hash-expired.error';
import * as faker from 'faker';
import { UserNotFoundError } from '@exception/users/user-not-found.error';
import { DatabaseError } from '@exception/database.error';
import { JWTService } from '@services/jwt.service';
import { ResetPassDTO } from '@dto/resetPassDTO';
import { RecoverPassDTO } from '@dto/recoverPassDTO';
import { EmailService } from '@services/email.service';
import { mocked } from 'ts-jest/utils';
import { UserRepository } from '@repositories/users.repository';
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getCustomRepository: jest.fn()
  };
});
mocked(getCustomRepository).mockReturnValue(mockUserRepository);

let usersService: UsersService;
let jwtService: JWTService;
let user: User;
let token: string;
let resetPassDTO: ResetPassDTO;
let recoverPassDTO: RecoverPassDTO;
let userRepository: Partial<UserRepository>;

describe('UsersService', () => {
  beforeAll( () => {
    usersService = Container.get(UsersService);
    jwtService = Container.get(JWTService);
    userRepository = getCustomRepository(UserRepository);
  });

  it('all dependencies should be defined', () => {
    expect(usersService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(getCustomRepository).toReturnWith(mockUserRepository);
  });

  describe('comparePassword', () => {
    let userPassword: string;
    let fakePassword: string;

    beforeEach(() => {
      fakePassword = faker.lorem.word(6);
      userPassword = hashSync(fakePassword, genSaltSync());
    });

    it('should return true when the passwords match', () => {
      const hashedPassword = fakePassword;
      const result = usersService.comparePassword({
        password: hashedPassword,
        userPassword
      });
      expect(result).toBeTruthy();
    });

    it("should return false when the passwords don't match", () => {
      const fakePass = faker.lorem.word(6);
      const result = usersService.comparePassword({ password: fakePass, userPassword });
      expect(result).toBeFalsy();
    });
  });

  describe('verifyUser', () => {
    beforeEach(async () => {
      user = await factory(User)().create();
    });

    it('should throw HashInvalidError when the hash is invalid', async () => {
      user.verifyHash = faker.datatype.uuid();

      jest.spyOn(usersService, 'showUserBy')
        .mockRejectedValueOnce(new HashInvalidError);

      await expect(usersService.verifyUser(user.verifyHash))
        .rejects.toThrowError(HashInvalidError);
    });

    it('should throw HashExpiredError when the hash is expired', async () => {
      user.verifyHashExpiresAt = faker.date.past();

      jest.spyOn(usersService, 'showUserBy')
        .mockResolvedValueOnce(user);

      await expect(usersService.verifyUser(user.verifyHash))
        .rejects.toThrowError(HashExpiredError);
    });

    it('should verify the user email when hash valid and not expired', async () => {
      jest.spyOn(usersService, 'showUserBy')
        .mockResolvedValueOnce(user);
      jest.spyOn(userRepository, 'update')
        .mockResolvedValueOnce(mockUpdateResult);

      const userVerified = await usersService.verifyUser(user.verifyHash);
      expect(userVerified.verified).toBeTruthy();
      expect(userVerified.verifyHash).toBeNull();
      expect(userVerified.verifyHashExpiresAt).toBeNull();
    });
  });

  describe('getUserByFBIDOrEmail', () => {
    beforeAll(async () => {
      user = await factory(User)().make();
      user.facebookID = faker.datatype.uuid();
    });

    it('should return the user when facebook ID or email given', async () => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(user);

      const userLogged = await usersService.getUserByFBIDOrEmail(
        user.facebookID,
        user.email
      );
      expect(userLogged.facebookID).toBe(user.facebookID);
      expect(userLogged.email).toBe(user.email);
    });

    it('should throw UserNotFoundError when user not found', async () => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null);

      await expect(usersService.getUserByFBIDOrEmail(
        user.facebookID,
        user.email
      )).rejects.toThrowError(UserNotFoundError);
    });
  });

  describe('findOrCreateUserFacebook', () => {
    beforeEach( async () => {
      user = await factory(User)().make();
      user.facebookID = faker.datatype.uuid();
    });

    it('should return the user when previously authenticated with FB', async () => {
      jest.spyOn(usersService, 'getUserByFBIDOrEmail')
        .mockResolvedValueOnce(user);

      const userResponse = await usersService.findOrCreateUserFacebook(user);
      expect(userResponse).toBe(user);
    });

    it('should return the user when previously authenticated with Email', async () => {
      const _user = await factory(User)().make( user );
      user.facebookID = null;
      jest.spyOn(usersService, 'getUserByFBIDOrEmail')
        .mockResolvedValueOnce(user);
      jest.spyOn(userRepository, 'save')
        .mockResolvedValueOnce(_user);

      const userResponse = await usersService.findOrCreateUserFacebook(_user);
      expect(userResponse).toBe(_user);
    });

    it('should return the user when not previously created', async () => {
      jest.spyOn(usersService, 'getUserByFBIDOrEmail')
        .mockRejectedValueOnce(new UserNotFoundError());
      jest.spyOn(userRepository, 'save')
        .mockResolvedValueOnce(user);

      const userResponse = await usersService.findOrCreateUserFacebook(user);
      expect(userResponse).toBe(user);
    });

    it('should return DatabaseError when fails at saving the user', async () => {
      jest.spyOn(usersService, 'getUserByFBIDOrEmail')
        .mockRejectedValueOnce(new UserNotFoundError());
      jest.spyOn(userRepository, 'save')
        .mockRejectedValueOnce(new DatabaseError('Test error.'));

      await expect(usersService.findOrCreateUserFacebook(user)).rejects.toThrowError(DatabaseError);
    });
  });

  describe('showUserBy', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().make();
    });

    it('should return the user when existing ID provided', async ( ) => {
      jest.spyOn(userRepository, 'findBy')
        .mockResolvedValueOnce(user);
      await expect(usersService.showUserBy({ id: user.id }))
        .resolves.toBe(user);
    });

    it('should return UserNotFound error when ID does not exist', async ( ) => {
      jest.spyOn(userRepository, 'findBy')
        .mockRejectedValueOnce(new Error('Test error.'));
      await expect(usersService.showUserBy({ id: user.id }))
        .rejects.toThrowError(UserNotFoundError);
    });
  });

  describe('generateToken', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().make();
      token = await jwtService.createJWT(user);
    });

    it('should return the token for the user', async ( ) => {
      jest.spyOn(jwtService, 'createJWT')
        .mockResolvedValueOnce(token);
      await expect(usersService.generateToken(user))
        .resolves.toBe(token);
    });

    it('should return Error when failed at generating token', async ( ) => {
      jest.spyOn(jwtService, 'createJWT')
        .mockRejectedValueOnce(new Error('Test error'));
      await expect(usersService.generateToken(user))
        .rejects.toThrowError(Error);
    });
  });

  describe('resetPassword', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().create();
      resetPassDTO = await factory(ResetPassDTO)().make({ email: user.email });
      user.passwordHashExpiresAt = faker.date.future();
    });

    it('should return the user with the new password when email and password hash exists', async ( ) => {
      jest.spyOn(usersService, 'showUserBy')
        .mockResolvedValueOnce(user);
      jest.spyOn(usersService, 'hashUserPassword')
        .mockImplementationOnce( ( ) => {
          user.password = resetPassDTO.password;
        });
      jest.spyOn(userRepository, 'save')
        .mockResolvedValueOnce(user);
      await expect(usersService.resetPassword(resetPassDTO))
        .resolves.toBe(user);
    });

    it('should return UserNotFound when not valid email or hash', async ( ) => {
      jest.spyOn(usersService, 'showUserBy')
        .mockRejectedValueOnce(new UserNotFoundError());
      jest.spyOn(usersService, 'hashUserPassword')
        .mockImplementationOnce( ( ) => {
          user.password = resetPassDTO.password;
        });
      await expect(usersService.resetPassword(resetPassDTO))
        .rejects.toThrowError(UserNotFoundError);
    });

    it('should return HashExpiredError when passwordHash is expired', async ( ) => {
      user.passwordHashExpiresAt = faker.date.past();
      jest.spyOn(usersService, 'showUserBy')
        .mockResolvedValueOnce(user);
      jest.spyOn(usersService, 'hashUserPassword')
        .mockImplementationOnce( ( ) => {
          user.password = resetPassDTO.password;
        });
      await expect(usersService.resetPassword(resetPassDTO))
        .rejects.toThrowError(HashExpiredError);
    });
  });

  describe('recoverPassword', ( ) => {
    beforeAll( async ( ) => {
      user = await factory(User)().make( );
      recoverPassDTO = await factory(RecoverPassDTO)().make({ email: user.email });
    });

    it('should return true when email to recover password is correctly sent', async ( ) => {
      jest.spyOn(usersService, 'showUserBy')
        .mockResolvedValueOnce(user);
      jest.spyOn(usersService, 'updateUserPasswordHash')
        .mockImplementationOnce( async ( ) => {
          const passwordHash = faker.datatype.uuid();
          user.passwordHash = passwordHash;
          return user;
        });
      jest.spyOn(EmailService, 'sendEmail')
        .mockResolvedValueOnce(true);
      await expect(usersService.recoverPassword(recoverPassDTO))
        .resolves.toBeTruthy();
    });

    it('should return error when user not found by email', async ( ) => {
      jest.spyOn(usersService, 'showUserBy')
        .mockRejectedValueOnce(new UserNotFoundError( ));
      jest.spyOn(usersService, 'updateUserPasswordHash')
        .mockImplementationOnce( async ( ) => {
          const passwordHash = faker.datatype.uuid();
          user.passwordHash = passwordHash;
          return user;
        });
      jest.spyOn(EmailService, 'sendEmail')
        .mockResolvedValueOnce(true);
      await expect(usersService.recoverPassword(recoverPassDTO))
        .rejects.toThrowError(UserNotFoundError);
    });
  });

  describe('updateUserPasswordHash', ( ) => {
    it('should return the user password hash when user attemps to recover password', async ( ) => {
      const passwordHash = faker.datatype.uuid( );
      jest.spyOn(usersService, 'generatePasswordHash').mockImplementationOnce( ( ) => {
        return passwordHash;
      });
      user.passwordHash = passwordHash;
      jest.spyOn(userRepository, 'updatePasswordHash')
        .mockResolvedValueOnce(user);
      await expect(usersService.updateUserPasswordHash(user.id)).resolves.toBe(user);
    });

    it('should return database error when hash could not be saved', async ( ) => {
      jest.spyOn(userRepository, 'updatePasswordHash')
        .mockRejectedValueOnce( new Error('Test Error'));
      await expect(usersService.updateUserPasswordHash(user.id)).rejects.toThrowError(DatabaseError);
    });
  });
});
