/* eslint-disable camelcase */
/* eslint-disable max-len */
import { Target } from '@entities/target.entity';
import { factory } from 'typeorm-seeding';

export async function createTargets( amount: number, data?: Partial<Target> ): Promise<Target[]> {
  const targets = [];
  for (let i=0; i<amount; i++) {
    targets.push( await factory(Target)().make(data) );
  }
  return targets;
}
