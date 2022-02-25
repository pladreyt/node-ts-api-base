/* eslint-disable max-len */
import cron from 'node-cron';
import { Service } from 'typedi';
import { TargetsService } from '@services/targets.service';
import { SocketService } from '@services/socket.service';

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
      targetsMatch.forEach( ( targets: any ) => {
        this.socketService.notifyTargetsMatched(targets);
      });
      await this.targetsService.updateAwaitingCron( );
    }
  }

  start( ) {
    cron.schedule('*/30 * * * *', ( ) => {
      this.checkTargetsMatch();
    });
  }
}
