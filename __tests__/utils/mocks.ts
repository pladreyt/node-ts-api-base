import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

export const mockUpdateResult = new UpdateResult();
export const mockInsertResult = new InsertResult();
export const mockDeleteResult = new DeleteResult();

export const mockCreateQueryBuilder: any = {
  update: () => mockCreateQueryBuilder,
  set: () => mockCreateQueryBuilder,
  where: () => mockCreateQueryBuilder,
  execute: () => mockCreateQueryBuilder
};
