import { TargetRepository } from '@repositories/targets.repository';
import { TopicRepository } from '@repositories/topics.repository';
import { UserRepository } from '@repositories/users.repository';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

export const mockUpdateResult = new UpdateResult();
export const mockInsertResult = new InsertResult();
export const mockDeleteResult = new DeleteResult();

export const mockCreateQueryBuilder: any = {
  update: () => mockCreateQueryBuilder,
  set: () => mockCreateQueryBuilder,
  where: () => mockCreateQueryBuilder,
  execute: () => mockCreateQueryBuilder,
  getOneOrFail: () => mockCreateQueryBuilder
};

export const mockUserRepository: Partial<UserRepository> = {
  findBy: jest.fn().mockReturnThis(),
  updatePasswordHash: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  createQueryBuilder: jest.fn().mockReturnThis()
};

export const mockTopicRepository: Partial<TopicRepository> = {
  find: jest.fn().mockReturnThis()
};

export const mockTargetRepository: Partial<TargetRepository> = {
  softDelete: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis()
};
