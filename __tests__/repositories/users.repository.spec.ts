import { User } from '@entities/user.entity';
import { factory } from 'typeorm-seeding';
import { mockCreateQueryBuilder, mockUserRepository } from '../../__tests__/utils/mocks';

let user: User;

describe('UserRepository', () => {
  describe('findBy', ( ) => {
    beforeEach( async ( ) => {
      user = await factory(User)().make();
    });

    it('should return user when found on database', async ( ) => {
      jest.spyOn(mockUserRepository, 'createQueryBuilder')
        .mockImplementationOnce( ( ) => {
          mockCreateQueryBuilder.getOneOrFail = () => {
            return user;
          };
          return mockCreateQueryBuilder;
        });
      jest.spyOn(mockUserRepository, 'findBy').mockResolvedValueOnce(user);
      await expect(mockUserRepository.findBy({ id: user.id }))
        .resolves.toBe(user);
    });

    it('should return error when user not found', async ( ) => {
      jest.spyOn(mockUserRepository, 'createQueryBuilder')
        .mockImplementationOnce( ( ) => {
          mockCreateQueryBuilder.getOneOrFail = () => {
            throw new Error('Test error');
          };
          return mockCreateQueryBuilder;
        });

      jest.spyOn(mockUserRepository, 'findBy')
        .mockRejectedValueOnce(new Error('Test error'));
      await expect(mockUserRepository.findBy({ id: user.id }))
        .rejects.toThrowError(Error);
    });
  });
});
