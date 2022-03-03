import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Role } from '@entities/role.entity';

define(Role, (faker: typeof Faker) => {
  const role = new Role();
  role.id = faker.random.number();
  role.name = faker.random.word();

  return role;
});
