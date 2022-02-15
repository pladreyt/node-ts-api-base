import { useSeeding } from 'typeorm-seeding';

beforeAll(async () => {
  await useSeeding();
});

