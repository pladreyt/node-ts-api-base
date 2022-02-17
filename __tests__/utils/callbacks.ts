import { useSeeding } from 'typeorm-seeding';

beforeAll(async () => {
  await useSeeding();
});

afterEach(() => {
  jest.restoreAllMocks();
});

