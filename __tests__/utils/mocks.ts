import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

export const mockUpdateResult = new UpdateResult();
export const mockInsertResult = new InsertResult();
export const mockDeleteResult = new DeleteResult();

export interface IMockedQueryBuilderResponses {
  executeResponse?: unknown;
  getOneResponse?: unknown;
  getOneOrFailResponse?: unknown;
  getManyAndCountResponse?: unknown[];
  getManyResponse?: unknown[];
}

export function mockQueryBuilder(expectedResponse: IMockedQueryBuilderResponses): any {
  return jest.fn().mockImplementationOnce((_alias: string) => {
    return {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: expectedResponse.executeResponse instanceof Error ?
        jest.fn().mockRejectedValue(expectedResponse.executeResponse) :
        jest.fn().mockResolvedValue(expectedResponse.executeResponse),
      getOne: jest.fn().mockResolvedValue(expectedResponse.getOneResponse),
      getOneOrFail: expectedResponse.getOneOrFailResponse instanceof Error ?
        jest.fn().mockRejectedValue(expectedResponse.getOneOrFailResponse) :
        jest.fn().mockResolvedValue(expectedResponse.getOneOrFailResponse),
      getManyAndCount: jest.fn().mockResolvedValue(
        [expectedResponse.getManyAndCountResponse,
          expectedResponse.getManyAndCountResponse?.length || 0
        ]),
      getMany: jest.fn().mockResolvedValue(expectedResponse.getManyResponse)
    };
  });
}
