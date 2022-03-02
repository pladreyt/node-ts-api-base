/* eslint-disable max-len */
import cron from 'node-cron';
import { Service } from 'typedi';
import { TargetsService } from '@services/targets.service';
import { SocketService } from '@services/socket.service';
import { CRON_DURATION } from '@constants/cronDuration';
import { IMatchingTargets } from 'src/interfaces/target/target.interface';

@Service()
export class TargetCron {
  constructor( private targetsService: TargetsService, private socketService: SocketService ) { }

  async checkTargetsMatch( ): Promise<void> {
    const newTargets = await this.targetsService.anyNewTargets( );
    if ( newTargets ) {
      let targetsMatch = [];
      const targetsByTopic = await this.targetsService.showTargetsByTopic( );
      Object.keys(targetsByTopic).forEach( ( topicId: string ) => {
        const targetsMatched = this.targetsService.getTargetsMatched( targetsByTopic[topicId] );
        targetsMatch = [...targetsMatch, targetsMatched].flat();
      });
      targetsMatch.forEach( ( targets: IMatchingTargets ) => {
        this.socketService.notifyTargetsMatched(targets);
      });
      await this.targetsService.updateAwaitingCron( );
    }
  }

  start( ) {
    cron.schedule(CRON_DURATION.EVERY_30_MINUTES, ( ) => {
      this.checkTargetsMatch();
    });
  }
}
