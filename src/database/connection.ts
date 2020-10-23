import { createConnection, getConnection, Connection } from 'typeorm';
import { databaseConfig } from '@config';

const connection = {
  async create(callback?: (c: Connection) => void): Promise<void> {
    try {
      const connection = await createConnection(databaseConfig);
      if (callback) {
        callback(connection);
      }
    } catch (error) {
      throw new Error(`ERROR: Creating test db connection: ${error}`);
    }
  },

  async close(): Promise<void> {
    await getConnection().close();
  },

  async clear(): Promise<void> {
    const connection = getConnection();
    const entities = connection.entityMetadatas;

    const reposToClear: Promise<void>[] = [];
    entities.forEach(entity => {
      const repository = connection.getRepository(entity.name);
      try {
        reposToClear.push(repository.clear());
      } catch (error) {
        throw new Error(`ERROR: Cleaning test db: ${error}`);
      }
    });

    return Promise.all(reposToClear).then();
  }
};

export default connection;
