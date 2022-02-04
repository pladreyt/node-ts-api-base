/* eslint-disable max-len */
import { Container } from 'typedi';
import { TargetsService } from '@services/targets.service';
import { getRepository, Repository } from 'typeorm';
import { Target } from '@entities/target.entity';
import { factory } from 'typeorm-seeding';
import { User } from '@entities/user.entity';
import { TargetNotSavedException } from '@exception/targets/target-not-saved.exception';
import * as faker from 'faker';
import { UsersService } from '@services/users.service';
import { DatabaseError } from '@exception/database.error';
import { mockUpdateResult } from '../utils/mocks';

let targetsService: TargetsService;
let usersService: UsersService;
let targetRepository: Repository<Target>;
let target: Target;
let user: User;
let numberOfTargets: number;

describe('TargetsService', () => {
  beforeAll(async () => {
    targetsService = Container.get(TargetsService);
    usersService = Container.get(UsersService);
    targetRepository = getRepository<Target>(Target);
    user = await factory(User)().create();
    numberOfTargets = faker.datatype.number({
      'min': 0,
      'max': 9
    });
  });

  it('all dependencies should be defined', () => {
    expect(targetsService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('canCreateTargets', () => {
    it('should return true if targets < 10', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockResolvedValueOnce(numberOfTargets);

      const response = await targetsService.canCreateTargets(user.id);
      expect(response).toBeTruthy();
    });

    it('should return false if targets >= 10', async () => {
      numberOfTargets = faker.datatype.number({
        'min': 10
      });
      jest.spyOn(targetRepository, 'count')
        .mockResolvedValueOnce(numberOfTargets);

      const response = await targetsService.canCreateTargets(user.id);
      expect(response).toBeFalsy();
    });

    it('should return an error', async () => {
      jest.spyOn(targetRepository, 'count')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(targetsService.canCreateTargets(user.id))
        .rejects.toThrowError(Error);
    });
  });

  describe('createTarget', () => {
    beforeAll(async () => {
      target = await factory(Target)().make();
      user = await factory(User)().create();
    });

    it('should create the target', async () => {
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
      user = await factory(User)().create();
      target = await factory(Target)().create({ userId: user.id });
    });


    it('should return a list of targets for the user', async () => {
      jest.spyOn(targetRepository, 'find')
        .mockResolvedValueOnce([target]);

      const response = await targetsService.listTargets(user.id);
      expect(response).toEqual([target]);
      expect(response[0]).toBeInstanceOf(Target);
    });

    it('returns empty array if no targets found', async () => {
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
});
