import { EntityRepository, Repository } from 'typeorm';
import { Target } from '@entities/target.entity';

@EntityRepository(Target)
export class TargetRepository extends Repository<Target> {

}
