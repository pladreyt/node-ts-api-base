import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ContactDTO } from '@dto/contactDTO';

define(ContactDTO, (faker: typeof Faker) => {
  const contactDTO = new ContactDTO();
  contactDTO.firstName = faker.name.firstName();
  contactDTO.lastName = faker.name.lastName();
  contactDTO.email = faker.internet.email(contactDTO.firstName, contactDTO.lastName);
  contactDTO.subject = faker.lorem.sentence();
  contactDTO.body = faker.lorem.paragraph();

  return contactDTO;
});
