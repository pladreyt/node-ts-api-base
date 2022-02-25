/* eslint-disable camelcase */
import { factory } from 'typeorm-seeding';
import { Target } from '@entities/target.entity';
import { TargetRepository } from '@repositories/targets.repository';
import { mockUpdateResult } from '../mocks';

export const mockTargetRepository: Partial<TargetRepository> = {
  count: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  softDelete: jest.fn().mockReturnThis(),
  updateAwaitingCron: jest.fn().mockImplementation( async ( ) => {
    const targetUpdated = await factory(Target)().make();
    targetUpdated.awaiting_cron = false;
    return mockUpdateResult;
  }),
  showTargets: jest.fn().mockImplementation( async ( ) => {
    return mockTargetRepository.createQueryBuilder().getMany();
  })
};
