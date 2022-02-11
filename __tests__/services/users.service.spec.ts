/* eslint-disable max-len */
import { Container } from 'typedi';
import { genSaltSync, hashSync } from 'bcrypt';
import { UsersService } from '@services/users.service';
import { factory } from 'typeorm-seeding';
import { User } from '@entities/user.entity';
import { getRepository, Repository } from 'typeorm';
import { mockCreateQueryBuilder, mockUpdateResult } from '../utils/mocks';
import { HashInvalidError } from '@exception/users/hash-invalid.error';
import { HashExpiredError } from '@exception/users/hash-expired.error';
import * as faker from 'faker';
import { UserNotFoundError } from '@exception/users/user-not-found.error';
import { DatabaseError } from '@exception/database.error';
import { JWTService } from '@services/jwt.service';
import { ResetPassDTO } from '@dto/resetPassDTO';
import { RecoverPassDTO } from '@dto/recoverPassDTO';
import { EmailService } from '@services/email.service';

let usersService: UsersService;
let jwtService: JWTService;
let user: User;
let token: string;
let userRepository: Repository<User>;
let resetPassDTO: ResetPassDTO;
let recoverPassDTO: RecoverPassDTO;

describe('UsersService', () => {
  beforeAll( () => {
    usersService = Container.get(UsersService);
    userRepository = getRepository<User>(User);
    jwtService = Container.get(JWTService);
  });

  it('all dependencies should be defined', () => {
    expect(usersService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(jwtService).toBeDefined();
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
      const password = faker.lorem.word(6);
      const result = usersService.comparePassword({ password, userPassword });
      expect(result).toBeFalsy();
    });
  });

  describe('verifyUser', () => {
    beforeEach(async () => {
      user = await factory(User)().create();
    });

    it('should throw HashInvalidError when the hash is invalid', async () => {
      user.verifyHash = faker.datatype.uuid();

      jest.spyOn(usersService, 'showUserByHash')
        .mockRejectedValueOnce(new HashInvalidError);

      await expect(usersService.verifyUser(user.verifyHash))
        .rejects.toThrowError(HashInvalidError);
    });

    it('should throw HashExpiredError when the hash is expired', async () => {
      user.verifyHashExpiresAt = faker.date.past();

      jest.spyOn(usersService, 'showUserByHash')
        .mockResolvedValueOnce(user);

      await expect(usersService.verifyUser(user.verifyHash))
        .rejects.toThrowError(HashExpiredError);
    });

    it('should verify the user email when hash valid and not expired', async () => {
      jest.spyOn(usersService, 'showUserByHash')
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

  describe('showUserByEmail', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().make();
    });

    it('should return the user when existing email provided', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(user);
      await expect(usersService.showUserByEmail(user.email))
        .resolves.toBe(user);
    });

    it('should return UserNotFound error when email does not exist', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null);
      await expect(usersService.showUserByEmail(user.email))
        .rejects.toThrowError(UserNotFoundError);
    });
  });

  describe('showUser', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().create();
    });

    it('should return the user when existing ID provided', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(user);
      await expect(usersService.showUser(user.id))
        .resolves.toBe(user);
    });

    it('should return UserNotFound error when ID does not exist', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null);
      await expect(usersService.showUser(user.id))
        .rejects.toThrowError(UserNotFoundError);
    });
  });

  describe('showUserByHash', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().make();
    });

    it('should return the user when existing verifyHash provided', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(user);
      await expect(usersService.showUserByHash(user.verifyHash))
        .resolves.toBe(user);
    });

    it('should return UserNotFound error when verifyHash does not exist', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null);
      await expect(usersService.showUserByHash(user.verifyHash))
        .rejects.toThrowError(HashInvalidError);
    });
  });

  describe('showUserByEmailAndPasswordHash', ( ) => {
    beforeAll(async () => {
      user = await factory(User)().make();
      user.passwordHash = faker.datatype.uuid();
    });

    it('should return the user when both email and passwordHash exist', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(user);
      await expect(usersService.showUserByEmailAndPassswordHash(user.email, user.passwordHash))
        .resolves.toBe(user);
    });

    it('should return UserNotFound error when both email and passwordHash do not exist', async ( ) => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null);
      await expect(usersService.showUserByEmailAndPassswordHash(user.email, user.passwordHash))
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
      user = await factory(User)().make();
      resetPassDTO = await factory(ResetPassDTO)().make({ email: user.email });
    });

    it('should return the user with the new password when email and password hash exists', async ( ) => {
      jest.spyOn(usersService, 'showUserByEmailAndPassswordHash')
        .mockResolvedValueOnce(user);
      jest.spyOn(usersService, 'hashUserPassword')
        .mockImplementationOnce( ( ) => {
          user.password = resetPassDTO.password;
        });
      await expect(usersService.resetPassword(resetPassDTO))
        .resolves.toBe(user);
    });

    it('should return UserNotFound when not valid email or hash', async ( ) => {
      jest.spyOn(usersService, 'showUserByEmailAndPassswordHash')
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
      jest.spyOn(usersService, 'showUserByEmailAndPassswordHash')
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
      jest.spyOn(usersService, 'showUserByEmail')
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
      jest.spyOn(usersService, 'showUserByEmail')
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
      jest.spyOn(User, 'createQueryBuilder').mockImplementationOnce( ( ) => {
        mockCreateQueryBuilder.execute = () => {
          return { raw: [user] };
        };
        return mockCreateQueryBuilder;
      });
      await expect(usersService.updateUserPasswordHash(user.id)).resolves.toBe(user);
    });

    /* it('should return database error when hash could not be saved', async ( ) => {
      const passwordHash = faker.datatype.uuid( );
      jest.spyOn(usersService, 'generatePasswordHash').mockImplementationOnce( ( ) => {
        return passwordHash;
      });
      user.passwordHash = passwordHash;
      jest.spyOn(User, 'createQueryBuilder').mockImplementationOnce( ( ) => {
        mockCreateQueryBuilder.execute = () => {
          throw new Error('Test error');
        };
        return mockCreateQueryBuilder;
      });
      await expect(usersService.updateUserPasswordHash(user.id)).rejects.toThrowError(DatabaseError);
    }); */
  });
});
