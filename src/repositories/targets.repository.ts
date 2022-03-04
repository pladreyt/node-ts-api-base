/* eslint-disable camelcase */
import { EntityRepository, Repository, UpdateResult } from 'typeorm';
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

  async updateAwaitingCron( ): Promise<UpdateResult> {
    const resultQuery = this.createQueryBuilder( )
      .update(Target)
      .set(
        { awaiting_cron: false }
      )
      .where('awaiting_cron = :awaiting_cron', { awaiting_cron: true })
      .execute();
    return resultQuery;
  }
}
