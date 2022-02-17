import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

export const mockUpdateResult = new UpdateResult();
export const mockInsertResult = new InsertResult();
export const mockDeleteResult = new DeleteResult();

export interface IMockedQueryBuilderResponses {
  getOneResponse?: unknown;
  getOneOrFailResponse?: unknown;
  getManyAndCountResponse?: unknown[];
}

export function mockQueryBuilder(expectedResponse: IMockedQueryBuilderResponses) {
  return jest.fn().mockImplementationOnce((_alias: string) => {
    return {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(expectedResponse.getOneResponse),
      getOneOrFail: expectedResponse.getOneOrFailResponse instanceof Error ?
        jest.fn().mockRejectedValue(new Error())
        : jest.fn().mockResolvedValue(expectedResponse.getOneOrFailResponse),
      getManyAndCount: jest.fn().mockResolvedValue(
        [expectedResponse.getManyAndCountResponse,
          expectedResponse.getManyAndCountResponse?.length || 0
        ])
    };
  });
}
