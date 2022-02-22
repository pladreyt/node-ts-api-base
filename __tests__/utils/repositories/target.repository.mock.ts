/* eslint-disable camelcase */
import { factory } from 'typeorm-seeding';
import { Target } from '@entities/target.entity';
import { TargetRepository } from '@repositories/targets.repository';

export const mockTargetRepository: Partial<TargetRepository> = {
  count: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  softDelete: jest.fn().mockReturnThis(),
  showTargets: jest.fn().mockImplementation( async ( ) => {
    return mockTargetRepository.createQueryBuilder().getMany();
  }),
  findBy: jest.fn().mockImplementation( async (
    criteria: Partial<Target>
  ) => {
    const targetFound = await factory(Target)().make();
    criteria.awaiting_cron && ( targetFound.awaiting_cron = criteria.awaiting_cron );
    return mockTargetRepository.createQueryBuilder().getMany();
  })
};
