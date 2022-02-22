import { Column, Entity, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { Target } from './target.entity';

@Entity()
export class Topic extends Base {
  constructor(name: string, image: string) {
    super();
    this.name = name;
    this.image = image;
  }

  @Column()
  name: string;

  @Column()
  image: string;

  @OneToMany(() => Target, target => target.topic )
  targets: Target[];
}
