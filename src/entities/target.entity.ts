/* eslint-disable camelcase */
import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm';
import { Base } from './base.entity';
import { Topic } from './topic.entity';
import { User } from './user.entity';

@Entity()
export class Target extends Base {
  constructor(latitude: string, longitude: string) {
    super();
    this.location = `${latitude},${longitude}`;
  }
  @Column()
  title: string;

  @Column()
  radius: number;

  @Column({ type: 'point' })
  location: string;

  @Column()
  userId: number;

  @Column()
  topicId: number;

  @Column({ default: true })
  awaiting_cron: boolean;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => User, user => user.targets,
    { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
  )
  user: User;

  @ManyToOne(() => Topic, topic => topic.targets,
    { onDelete: 'CASCADE', onUpdate: 'CASCADE' }
  )
  topic: Topic;
}
