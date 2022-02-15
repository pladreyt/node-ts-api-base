import { EntityRepository, Repository } from 'typeorm';
import { Topic } from '@entities/topic.entity';

@EntityRepository(Topic)
export class TopicRepository extends Repository<Topic> {

}
