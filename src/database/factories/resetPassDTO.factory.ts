import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ResetPassDTO } from '@dto/resetPassDTO';

define(ResetPassDTO, (faker: typeof Faker) => {
  const resetPassDTO = new ResetPassDTO();
  resetPassDTO.email = faker.internet.email();
  resetPassDTO.password = faker.internet.password();
  resetPassDTO.passwordHash = faker.random.uuid();

  return resetPassDTO;
});
