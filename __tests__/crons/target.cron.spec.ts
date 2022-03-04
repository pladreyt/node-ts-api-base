import { Container } from 'typedi';
import { factory } from 'typeorm-seeding';
import { getCustomRepository, UpdateResult } from 'typeorm';
import { mocked } from 'ts-jest/utils';
import { TargetsService } from '@services/targets.service';
import { Target } from '@entities/target.entity';
import { SocketService } from '@services/socket.service';
import { mockTargetRepository } from '../utils/repositories/target.repository.mock';
import { TargetCron } from '@crons/targets.cron';
import { User } from '@entities/user.entity';
import { Topic } from '@entities/topic.entity';

jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getCustomRepository: jest.fn()
  };
});
mocked(getCustomRepository).mockReturnValue(mockTargetRepository);
describe('TargetCron', () => {
  let targetCron: TargetCron;
  let targetsService: TargetsService;
  let socketService: SocketService;

  beforeAll( ( ) => {
    targetCron = Container.get(TargetCron);
    targetsService = Container.get(TargetsService);
    socketService = Container.get(SocketService);
  });

  it('all dependencies should be defined', () => {
    expect(targetCron).toBeDefined();
    expect(targetsService).toBeDefined();
    expect(socketService).toBeDefined();
  });

  describe('checkTargetsMatch', () => {
    let targetUserA: Target;
    let targetUserB: Target;
    let userA: User;
    let userB: User;
    let topic: Topic;

    beforeEach( async ( ) => {
      userA = await factory(User)().make({ id: 1 });
      userB = await factory(User)().make({ id: 2 });
      topic = await factory(Topic)().make({ id: 1 });
      targetUserA = await factory(Target)().make(
        { topicId: topic.id,
          userId: userA.id,
          location: '50,50',
          radius: 10,
          user: userA,
          topic: topic
        });
      targetUserB = await factory(Target)().make(
        { topicId: topic.id,
          userId: userB.id,
          location: '50,50',
          radius: 10,
          user: userB,
          topic: topic
        });
    });
    it('should notify the users when there are targets that match', async ( ) => {
      jest.spyOn(targetsService, 'anyNewTargets').mockResolvedValueOnce( true );
      jest.spyOn(targetsService, 'showTargetsByTopic').mockResolvedValueOnce(
        {
          '1': [targetUserA, targetUserB]
        }
      );
      jest.spyOn(targetsService, 'getTargetsMatched').mockReturnValueOnce(
        [{ newTarget: targetUserA, target: targetUserB }]
      );

      jest.spyOn(socketService, 'notifyTargetsMatched').mockImplementation( ( ) => {
        return jest.fn();
      });

      jest.spyOn(targetsService, 'updateAwaitingCron').mockResolvedValueOnce(
        new UpdateResult
      );
      await targetCron.checkTargetsMatch();
      expect(jest.spyOn(socketService, 'notifyTargetsMatched')).toBeCalled();
    });

    it('should not notify the users when there are no targets that match', async ( ) => {
      jest.spyOn(targetsService, 'anyNewTargets').mockResolvedValueOnce( true );
      jest.spyOn(targetsService, 'showTargetsByTopic').mockResolvedValueOnce(
        {
          '1': [targetUserA, targetUserB]
        }
      );
      jest.spyOn(targetsService, 'getTargetsMatched').mockReturnValueOnce([]);

      await targetCron.checkTargetsMatch();
      expect(jest.spyOn(socketService, 'notifyTargetsMatched')).not.toBeCalled();
    });
  });
});
