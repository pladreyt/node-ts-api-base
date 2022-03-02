/* eslint-disable camelcase */
/* eslint-disable max-len */
import { Container } from 'typedi';
import { getCustomRepository } from 'typeorm';
import { mocked } from 'ts-jest/utils';
import { factory } from 'typeorm-seeding';
import * as faker from 'faker';
import { Target } from '@entities/target.entity';
import { User } from '@entities/user.entity';
import { TargetNotSavedException } from '@exception/targets/target-not-saved.exception';
import { UsersService } from '@services/users.service';
import { DatabaseError } from '@exception/database.error';
import { mockUpdateResult } from '../utils/mocks';
import { TargetRepository } from '@repositories/targets.repository';
import { TargetsService } from '@services/targets.service';
import { mockTargetRepository } from '../utils/repositories/target.repository.mock';
import { createTargets } from '../utils/targets';

let targetsService: TargetsService;
let usersService: UsersService;
let target: Target;
let user: User;
let numberOfTargets: number;
let targetRepository: Partial<TargetRepository>;
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getCustomRepository: jest.fn()
  };
});
mocked(getCustomRepository).mockReturnValue(mockTargetRepository);

describe('TargetsService', () => {
  beforeAll(async () => {
    targetsService = Container.get(TargetsService);
    usersService = Container.get(UsersService);
    targetRepository = getCustomRepository(TargetRepository);
    user = await factory(User)().make();
    numberOfTargets = faker.datatype.number({
      'min': 0,
      'max': 9
    });
  });

  it('all dependencies should be defined', () => {
    expect(targetsService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(targetRepository).toBeDefined();
  });

  describe('canCreateTargets', () => {
    it('should return true when targets < 10', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockResolvedValueOnce(numberOfTargets);

      const response = await targetsService.canCreateTargets(user.id);
      expect(response).toBeTruthy();
    });

    it('should return false when targets >= 10', async () => {
      numberOfTargets = faker.datatype.number({
        'min': 10
      });
      jest.spyOn(targetRepository, 'count')
        .mockResolvedValueOnce(numberOfTargets);

      const response = await targetsService.canCreateTargets(user.id);
      expect(response).toBeFalsy();
    });

    it('should return an error when database cannot be accessed', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(targetsService.canCreateTargets(user.id))
        .rejects.toThrowError(Error);
    });
  });

  describe('createTarget', () => {
    beforeAll(async () => {
      user = await factory(User)().make();
      target = await factory(Target)().make();
    });

    it('should create the target when data provided is valid', async () => {
      jest.spyOn(targetsService, 'canCreateTargets')
        .mockResolvedValueOnce(true);

      jest.spyOn(targetRepository, 'save')
        .mockResolvedValueOnce(target);

      await expect(targetsService.createTarget(target, user.id))
        .resolves.toBe(target);
    });

    it('should throw TargetNotSavedException when creating the target if error has ocurred', async () => {
      jest.spyOn(targetsService, 'canCreateTargets')
        .mockResolvedValueOnce(true);

      jest.spyOn(targetRepository, 'save')
        .mockRejectedValueOnce(new TargetNotSavedException('Test error'));

      await expect(targetsService.createTarget(target, user.id))
        .rejects.toThrowError(TargetNotSavedException);
    });

    it('should throw TargetNotSavedException when reaching more than 10 targets', async () => {
      jest.spyOn(targetsService, 'canCreateTargets')
        .mockResolvedValueOnce(false);

      jest.spyOn(targetRepository, 'save')
        .mockRejectedValueOnce(new TargetNotSavedException('Test error'));

      await expect(targetsService.createTarget(target, user.id))
        .rejects.toThrowError(TargetNotSavedException);
    });
  });

  describe('listTargets', () => {
    beforeEach(async () => {
      user = await factory(User)().make();
      target = await factory(Target)().make();
    });


    it('should return a list of targets for the user when requested', async () => {
      jest.spyOn(targetRepository, 'find')
        .mockResolvedValueOnce([target]);

      const response = await targetsService.listTargets(user.id);
      expect(response).toEqual([target]);
      expect(response[0]).toBeInstanceOf(Target);
    });

    it('returns empty array when no targets found', async () => {
      jest.spyOn(targetRepository, 'find')
        .mockResolvedValueOnce([]);

      const response = await targetsService.listTargets(user.id);
      expect(response).toBeInstanceOf(Array);
      expect(response).toEqual([]);
    });

    it('should return error when retrieving targets', async () => {
      jest.spyOn(targetRepository, 'find')
        .mockRejectedValueOnce(new DatabaseError('Test Error'));

      await expect(targetsService.listTargets(user.id))
        .rejects.toThrowError(DatabaseError);
    });
  });

  describe('deleteTarget', () => {
    it('should delete the target', async () => {
      jest.spyOn(targetRepository, 'softDelete')
        .mockResolvedValueOnce(mockUpdateResult);

      const response = await targetsService.deleteTarget(target.id, user.id);
      expect(response).toEqual(mockUpdateResult);
    });

    it('should return error when deleting the target', async () => {
      jest.spyOn(targetRepository, 'softDelete')
        .mockRejectedValueOnce(mockUpdateResult);

      await expect(targetsService.deleteTarget(target.id, user.id))
        .rejects.toThrowError(DatabaseError);
    });
  });

  describe('anyNewTargets', () => {
    beforeEach( ( ) => {
      numberOfTargets = faker.datatype.number({
        'min': 1
      });
    });

    it('should return true when any new targets created', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockResolvedValueOnce(numberOfTargets);
      await expect(targetsService.anyNewTargets())
        .resolves.toBeTruthy();
    });

    it('should return false when there are no new targets created', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockResolvedValueOnce(0);
      await expect(targetsService.anyNewTargets())
        .resolves.toBeFalsy();
    });

    it('should return error when database cannot be accessed', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockRejectedValueOnce(new Error('Test Error'));
      await expect(targetsService.anyNewTargets())
        .rejects.toThrowError(DatabaseError);
    });
  });

  describe('updateAwaitingCron', ( ) => {
    it('should update the targets when requested', async ( ) => {
      jest.spyOn(targetRepository, 'updateAwaitingCron')
        .mockResolvedValue(mockUpdateResult);
      await expect(targetsService.updateAwaitingCron())
        .resolves.toBe(mockUpdateResult);
    });

    it('should throw error when the targets cannot be updated', async ( ) => {
      jest.spyOn(targetRepository, 'updateAwaitingCron')
        .mockRejectedValueOnce(mockUpdateResult);
      await expect(targetsService.updateAwaitingCron())
        .rejects.toThrowError(DatabaseError);
    });
  });

  describe('showTargetsByTopic', ( ) => {
    let targets: Target[];
    beforeEach( async ( ) => {
      targets = await createTargets(3);
    });

    it('should retrieve the targets segmented by topic when requested', async ( ) => {
      jest.spyOn(targetRepository, 'showTargets')
        .mockResolvedValue(targets);
      const targetsByTopic = await targetsService.showTargetsByTopic( );
      expect(Object.keys(targetsByTopic).length).toBe(3);
    });

    it('should throw error when the database cannot be accessed', async ( ) => {
      jest.spyOn(targetRepository, 'showTargets')
        .mockRejectedValueOnce(new Error('Test Error'));
      await expect(targetsService.showTargetsByTopic())
        .rejects.toThrowError(Error);
    });
  });

  describe('getTargetsMatched', ( ) => {
    let targets: Target[];
    beforeEach( ( ) => {
      targets = [];
    });

    it('should return an array with targets when there are targets that matched', async ( ) => {
      targets = await createTargets(3, {
        topicId: 1,
        awaiting_cron: true,
        location: '50,50'
      });
      const targetsMatched = targetsService.getTargetsMatched(targets);
      expect(targetsMatched).toBeInstanceOf(Array);
      expect(targetsMatched).not.toHaveLength(0);
    });

    it('should return an empty array when no targets matched', async ( ) => {
      targets = await createTargets(3, {
        userId: 1,
        awaiting_cron: true,
        location: '50,50'
      });
      const targetsMatched = targetsService.getTargetsMatched(targets);
      expect(targetsMatched).toBeInstanceOf(Array);
      expect(targetsMatched).toHaveLength(0);
    });
  });
});
