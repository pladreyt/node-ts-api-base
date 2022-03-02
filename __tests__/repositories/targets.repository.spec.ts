/* eslint-disable camelcase */
import { getCustomRepository, UpdateResult } from 'typeorm';
import { mocked } from 'ts-jest/utils';
import { Target } from '@entities/target.entity';
import { TargetRepository } from '@repositories/targets.repository';
import { mockQueryBuilder } from '../utils/mocks';

let target: Target;
let targetRepository: Partial<TargetRepository>;
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getCustomRepository: jest.fn()
  };
});

mocked(getCustomRepository).mockReturnValue(new TargetRepository);
describe('TargetRepository', () => {
  beforeAll( () => {
    targetRepository = getCustomRepository(TargetRepository);
  });

  it('all dependencies should be defined', () => {
    expect(targetRepository).toBeDefined();
  });

<<<<<<< HEAD
=======
  describe('findBy', ( ) => {
    beforeEach( async ( ) => {
      target = await factory(Target)().make({ awaiting_cron: true });
    });

    it('should return list of targets when criteria found on database', async ( ) => {
      targetRepository.createQueryBuilder = mockQueryBuilder(
        { getManyResponse: [target] }
      );
      const targetsFound = await targetRepository.findBy({ awaiting_cron: true });
      expect(targetsFound).toBeInstanceOf(Array);
      expect(targetsFound).not.toHaveLength(0);
      expect(targetsFound.every(
        (target: Target) => target.awaiting_cron === true)
      ).toBe(true);
    });

    it('should return an empty list when criteria not found on database', async ( ) => {
      targetRepository.createQueryBuilder = mockQueryBuilder(
        { getManyResponse: [] }
      );
      const targetsFound = await targetRepository.findBy({ awaiting_cron: true });
      expect(targetsFound).toBeInstanceOf(Array);
      expect(targetsFound).toHaveLength(0);
    });
  });

>>>>>>> e9fe0c3 (Add target match methods)
  describe('showTargets', () => {
    it('should return list of targets when requested', async ( ) => {
      targetRepository.createQueryBuilder = mockQueryBuilder(
        { getManyResponse: [target] }
      );
      const targetsFound = await targetRepository.showTargets();
      expect(targetsFound).toBeInstanceOf(Array);
      expect(targetsFound).not.toHaveLength(0);
    });

    it('should return empty list of targets when no existing targets', async ( ) => {
      targetRepository.createQueryBuilder = mockQueryBuilder(
        { getManyResponse: [] }
      );
      const targetsFound = await targetRepository.showTargets();
      expect(targetsFound).toBeInstanceOf(Array);
      expect(targetsFound).toHaveLength(0);
    });
  });

  describe('updateAwaitingCron', () => {
    it('should update awaiting_cron when cron has executed', async ( ) => {
      targetRepository.createQueryBuilder = mockQueryBuilder(
        { executeResponse: new UpdateResult }
      );
      const updateResult = await targetRepository.updateAwaitingCron();
      expect(updateResult).toBeInstanceOf(UpdateResult);
    });

    it('should return Error when fails at updating the targets', async ( ) => {
      targetRepository.createQueryBuilder = mockQueryBuilder(
        { executeResponse: new Error('Test error') }
      );
      await expect(targetRepository.updateAwaitingCron())
        .rejects.toThrowError(Error);
    });
  });
});
