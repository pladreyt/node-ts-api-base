import { Service } from 'typedi';
import { getCustomRepository, UpdateResult } from 'typeorm';
import { isPointWithinRadius } from 'geolib';
import { Target } from '@entities/target.entity';
import { TargetNotSavedException } from '@exception/targets/target-not-saved.exception';
import { TargetErrorsMessages } from '@constants/errorMessages';
import { DatabaseError } from '@exception/database.error';
import { TargetRepository } from '@repositories/targets.repository';

@Service()
export class TargetsService {
  // eslint-disable-next-line max-len
  private readonly targetRepository = getCustomRepository<TargetRepository>(TargetRepository);

  async canCreateTargets(userId: number): Promise<boolean> {
    try {
      const numberTargets = await this.targetRepository.count({ where: { userId } });
      return numberTargets < 10;
    } catch (error) {
      throw new Error(`${error}`);
    }
  }

  async createTarget(target: Target, userId: number): Promise<Target> {
    try {
      const canCreate = await this.canCreateTargets(userId);
      if (!canCreate) {
        throw new Error(TargetErrorsMessages.TARGET_USER_MORE_10);
      }
      target.userId = userId;
      const targetResult = await this.targetRepository.save(target);
      return targetResult;
    } catch (error) {
      throw new TargetNotSavedException(`${error}`);
    }
  }

  async showTargetsByTopic( ) {
    const targets = await this.targetRepository.showTargets( );
    const targetsByTopic = {};
    targets.forEach( ( target: Target ) => {
      if (!targetsByTopic.hasOwnProperty(target.topicId)) {
        targetsByTopic[target.topicId] = [];
      }
      targetsByTopic[target.topicId].push(target);
    });
    return targetsByTopic;
  }

  getTargetsMatched( targets: Target[] ): Target[] {
    const targetsMatched = [];
    const newTargets = targets.filter( target => target.awaiting_cron );
    newTargets.forEach( (newTarget: Target) => {
      const newTargetPosition = {
        latitude: newTarget.location[0],
        longitude: newTarget.location[1]
      };
      targets.forEach( ( target: Target ) => {
        if ( newTarget.userId !== target.userId ) {
          const possibleMatchPosition = {
            latitude: target.location[0],
            longitude: target.location[1]
          };
          if ( isPointWithinRadius(
            newTargetPosition,
            possibleMatchPosition,
            target.radius )
          ) {
            targetsMatched.push({ newTarget, target });
          }
        }
      });
    });
    return targetsMatched;
  }

  async listTargets( userId: number ): Promise<Target[]> {
    try {
      const targets = await this.targetRepository.find({ userId });
      return targets;
    } catch (error) {
      throw new DatabaseError(`${error}`);
    }
  }

  async deleteTarget(id: number, userId: number): Promise<UpdateResult> {
    try {
      const deleteResult = await this.targetRepository.softDelete(
        { id, userId }
      );
      return deleteResult;
    } catch ( error ) {
      throw new DatabaseError(`${error}`);
    }
  }
}
