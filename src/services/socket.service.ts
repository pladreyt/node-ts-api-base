import { Service } from 'typedi';
import { socketClient } from '@server';

@Service()
export class SocketService {
  notifyTargetsMatched( matchingTargets: any ) {
    socketClient.to(`user:${matchingTargets.newTarget.userId}`)
      .emit('target_match',
        `Congrats! You matched with ${matchingTargets.target.user.firstName}
        on ${matchingTargets.target.topic.name}`
      );
    socketClient.to(`user:${matchingTargets.target.userId}`)
      .emit('target_match',
        `Congrats! You matched with ${matchingTargets.newTarget.user.firstName}
        on ${matchingTargets.newTarget.topic.name}`
      );
  }
}
