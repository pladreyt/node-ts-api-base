import { EntityRepository, Repository } from 'typeorm';
import { User } from '@entities/user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findBy(criteria: Partial<User>): Promise<User> {
    const query = this.createQueryBuilder( );
    criteria.id && query.andWhere('id = :id', { id: criteria.id });
    criteria.email && query.andWhere('email = :email', { email: criteria.email });
    criteria.verifyHash && query.andWhere('verifyHash = :verifyHash',
      { verifyHash: criteria.verifyHash });
    criteria.facebookID && query.andWhere('facebookID = :facebookID',
      { facebookID: criteria.facebookID });
    criteria.passwordHash && query.andWhere('passwordHash = :passwordHash',
      { passwordHash: criteria.passwordHash });
    return query.getOneOrFail();
  }

  async updatePasswordHash( userId: number, passwordHash: string ): Promise<User> {
    const query = await this.createQueryBuilder()
      .update(User)
      .set(
        { passwordHash: passwordHash,
          // eslint-disable-next-line quotes
          passwordHashExpiresAt: () => `NOW() +INTERVAL '1 day'`
        }
      )
      .where('id = :id', { id: userId })
      .returning('*')
      .execute();
    return query.raw[0];
  }
}
