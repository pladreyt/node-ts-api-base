/* eslint-disable max-len */
import Container from 'typedi';
import { JWTService } from '@services/jwt.service';
import { factory } from 'typeorm-seeding';
import { User } from '@entities/user.entity';
import { AuthInterface } from '@interfaces';

let jwtService: JWTService;

describe('JWTService', () => {
  beforeAll(() => {
    jwtService = Container.get(JWTService);
  });

  it('all dependencies should be defined', () => {
    expect(jwtService).toBeDefined();
  });

  describe('decodeJWT', () => {
    let token: string;
    let user: User;
    beforeEach(async () => {
      user = await factory(User)({ id: 1 }).make();
      token = await jwtService.createJWT(user);
    });
    it('should return correct payload data when decoding token', async () => {
      const idealPayloadData: AuthInterface.TokenPayloadData = {
        email: user.email,
        userId: user.id,
        role: user.role
      };
      const decoded = await jwtService.decodeJWT(token);
      expect(decoded['data']).toMatchObject(idealPayloadData);
    });
  });
});
