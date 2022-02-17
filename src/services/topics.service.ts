import { Service } from 'typedi';
import { getCustomRepository } from 'typeorm';
import { Topic } from '@entities/topic.entity';
import { TopicRepository } from '@repositories/topics.repository';

@Service()
export class TopicsService {
  // eslint-disable-next-line max-len
  private readonly topicRepository = getCustomRepository<TopicRepository>(TopicRepository);

  async listTopics(): Promise<Topic[]> {
    return this.topicRepository.find();
  }
}
