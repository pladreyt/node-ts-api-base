/* eslint-disable camelcase */
import { EntityRepository, Repository } from 'typeorm';
import { Target } from '@entities/target.entity';

@EntityRepository(Target)
export class TargetRepository extends Repository<Target> {
  async showTargets(): Promise<Target[]> {
    const targets = this.createQueryBuilder('target')
      .innerJoinAndSelect('target.user', 'user')
      .innerJoinAndSelect('target.topic', 'topic')
      .getMany();
    return targets;
  }

  async findBy(criteria: Partial<Target>): Promise<Target[]> {
    const query = this.createQueryBuilder( );
    criteria.awaiting_cron && query.andWhere('awaiting_cron = :awaiting_cron',
      { awaiting_cron: criteria.awaiting_cron }
    );
    return query.getMany();
  }
}
