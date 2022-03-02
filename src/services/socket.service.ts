/* eslint-disable max-len */
import { Service } from 'typedi';
import { socketClient } from '@server';
import { IMatchingTargets } from 'src/interfaces/target/target.interface';
import { Target } from '@entities/target.entity';

@Service()
export class SocketService {
  notifyTargetsMatched( matchingTargets: IMatchingTargets ) {
    this.notifyMatchedTargetToUser( matchingTargets.target, matchingTargets.newTarget.userId );
    this.notifyMatchedTargetToUser( matchingTargets.newTarget, matchingTargets.target.userId );
  }

  private notifyMatchedTargetToUser( target: Target, userId: number ) {
    socketClient.to(`user:${userId}`)
      .emit('target_match',
        `Congrats! You matched with ${target.user.firstName}
        on ${target.topic.name}`
      );
  }
}
