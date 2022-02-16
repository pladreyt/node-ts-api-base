import { TopicRepository } from '@repositories/topics.repository';

export const mockUserRepository: Partial<TopicRepository> = {
  find: jest.fn().mockReturnThis()
};
