import { Column, Entity } from 'typeorm';
import { Base } from './base.entity';

@Entity()
export class Role extends Base {
  @Column()
  name: string;
}
