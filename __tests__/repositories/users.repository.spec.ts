import { getCustomRepository } from 'typeorm';
import { factory } from 'typeorm-seeding';
import { mocked } from 'ts-jest/utils';
import * as faker from 'faker';
import { DatabaseError } from '@exception/database.error';
import { mockQueryBuilder } from '../utils/mocks';
import { mockUserRepository } from '../utils/repositories/user.repository.mock';
import { UserRepository } from '@repositories/users.repository';
import { User } from '@entities/user.entity';

let user: User;
let userRepository: Partial<UserRepository>;
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getCustomRepository: jest.fn()
  };
});

mocked(getCustomRepository).mockReturnValue(mockUserRepository);
describe('UserRepository', () => {
  beforeAll( () => {
    userRepository = getCustomRepository(UserRepository);
  });

  it('all dependencies should be defined', () => {
    expect(getCustomRepository).toReturnWith(mockUserRepository);
  });

  describe('findBy', ( ) => {
    beforeEach( async ( ) => {
      user = await factory(User)().make();
    });

    it('should return user when found on database', async ( ) => {
      userRepository.createQueryBuilder = mockQueryBuilder(
        { getOneOrFailResponse: user }
      );
      const userFound = await userRepository.findBy({ id: user.id });
      expect(userFound).toBeDefined();
      expect(userFound).toBeInstanceOf(User);
      expect(userFound.id).toBe(user.id);
    });

    it('should return error when user not found', async ( ) => {
      userRepository.createQueryBuilder = mockQueryBuilder(
        { getOneOrFailResponse: new Error() }
      );
      await expect(userRepository.findBy({ id: user.id }))
        .rejects.toThrowError(Error);
    });
  });

  describe('updatePasswordHash', ( ) => {
    beforeEach( async ( ) => {
      user = await factory(User)().make();
    });
    it('should return the user when passwordHash generated', async ( ) => {
      const passwordHash = faker.datatype.uuid();
      user.passwordHash = passwordHash;
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user);
      const userFound = await userRepository.updatePasswordHash(user.id, passwordHash);
      expect(userFound).toBeDefined();
      expect(userFound).toBeInstanceOf(User);
      expect(userFound.id).toBe(user.id);
      expect(userFound.passwordHash).toBe(user.passwordHash);
    });

    it('should return error when passwordHash not generated', async ( ) => {
      const passwordHash = faker.datatype.uuid();
      user.passwordHash = passwordHash;
      jest.spyOn(userRepository, 'findOne')
        .mockRejectedValueOnce(new DatabaseError('Test error'));
      await expect(userRepository.updatePasswordHash(user.id, passwordHash))
        .rejects.toThrow(DatabaseError);
    });
  });
});
