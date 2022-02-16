import { User } from '@entities/user.entity';
import { UserRepository } from '@repositories/users.repository';
import { factory } from 'typeorm-seeding';
import * as faker from 'faker';

export const mockUserRepository: Partial<UserRepository> = {
  findBy: jest.fn().mockImplementation(async (
    criteria: Partial<User>
  ): Promise<User> => {
    const userFound = await factory(User)().make();
    criteria.id && ( userFound.id = criteria.id );
    criteria.email && ( userFound.email = criteria.email );
    criteria.verifyHash && ( userFound.verifyHash = criteria.verifyHash );
    criteria.facebookID && ( userFound.facebookID = criteria.facebookID );
    criteria.passwordHash && ( userFound.passwordHash = criteria.passwordHash );

    return mockUserRepository.createQueryBuilder().getOneOrFail();
  }),

  updatePasswordHash: jest.fn().mockImplementation(async (
    userId: number,
    passwordHash: string
  ): Promise<User> => {
    const userFound = await factory(User)().make();
    userFound.id = userId;
    userFound.passwordHash = passwordHash;
    userFound.passwordHashExpiresAt = faker.date.future();
    return mockUserRepository.findOne(userId);
  }),
  save: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  createQueryBuilder: jest.fn().mockReturnThis()
};
