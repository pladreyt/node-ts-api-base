import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { RecoverPassDTO } from '@dto/recoverPassDTO';

define(RecoverPassDTO, (faker: typeof Faker) => {
  const recoverPassDTO = new RecoverPassDTO();
  recoverPassDTO.email = faker.internet.email();

  return recoverPassDTO;
});
