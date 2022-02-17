import { TopicRepository } from '@repositories/topics.repository';

export const mockTopicRepository: Partial<TopicRepository> = {
  find: jest.fn().mockReturnThis()
};
