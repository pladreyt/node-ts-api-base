import { Container } from 'typedi';
import { TopicsService } from '@services/topics.service';
import { Topic } from '@entities/topic.entity';
import { factory } from 'typeorm-seeding';
import { getCustomRepository } from 'typeorm';
import { mocked } from 'ts-jest/utils';
import { mockTopicRepository } from '../utils/mocks';
import { TopicRepository } from '@repositories/topics.repository';

let topicsService: TopicsService;
let topicRepository: Partial<TopicRepository>;
let topic: Topic;
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getCustomRepository: jest.fn()
  };
});
mocked(getCustomRepository).mockReturnValue(mockTopicRepository);
describe('TopicsService', () => {
  beforeAll( () => {
    topicsService = Container.get(TopicsService);
    topicRepository = getCustomRepository(TopicRepository);
  });

  it('all dependencies should be defined', () => {
    expect(topicsService).toBeDefined();
    expect(topicRepository).toBeDefined();
  });

  describe('listTopics', () => {
    beforeEach(async () => {
      topic = await factory(Topic)().make();
    });

    it('returns the topics list', async () => {
      jest.spyOn(topicRepository, 'find')
        .mockResolvedValueOnce([topic]);
      const response = await topicsService.listTopics();
      expect(response).toBeInstanceOf(Array);
      expect(response).not.toEqual([]);
    });

    it('returns empty array if no topics found', async () => {
      jest.spyOn(topicRepository, 'find')
        .mockResolvedValueOnce([]);
      const response = await topicsService.listTopics();
      expect(response).toBeInstanceOf(Array);
      expect(response).toEqual([]);
    });
  });
});
