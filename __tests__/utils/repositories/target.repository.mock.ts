import { TargetRepository } from '@repositories/targets.repository';

export const mockTargetRepository: Partial<TargetRepository> = {
  count: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  softDelete: jest.fn().mockReturnThis()
};
