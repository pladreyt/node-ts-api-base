import * as Faker from 'faker';
import { define, factory } from 'typeorm-seeding';
import { User } from '@entities/user.entity';
import { Gender } from '@constants/users/attributes.constants';
import { Role } from '@entities/role.entity';

define(User, (faker: typeof Faker) => {
  const user = new User();
  user.id = faker.random.number();
  user.firstName = faker.name.firstName();
  user.lastName = faker.name.lastName();
  user.gender = faker.random.arrayElement(Object.values(Gender));
  user.email = faker.internet.email(user.firstName, user.lastName);
  user.password = faker.internet.password(8);
  user.verified = false;
  user.verifyHash = faker.random.uuid();
  user.verifyHashExpiresAt = faker.date.future();
  user.role = factory(Role)() as any;

  return user;
});
