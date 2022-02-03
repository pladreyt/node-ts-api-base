import request from 'supertest';
import { factory } from 'typeorm-seeding';
import { Container } from 'typedi';
import app from '@app';
import { User } from '@entities/user.entity';
import { JWTService } from '@services/jwt.service';
import { API } from '../utils';
import { HttpStatusCode } from '@constants/httpStatusCode';
import { getRepository, Repository } from 'typeorm';
import { ErrorsMessages, TargetErrorsMessages } from '@constants/errorMessages';
import { CreateTargetDTO } from '@dto/createTargetDTO';
import { Target } from '@entities/target.entity';
import { UnauthorizedError } from '@exception/unauthorized.error';
import * as faker from 'faker';

let jwtService = Container.get(JWTService);
let user: User;
let target: Target;
let token: string;
let createTargetDTO: CreateTargetDTO;
let targetRepo: Repository<Target>;

describe('TargetController', () => {
  beforeAll(async () => {
    targetRepo = getRepository<Target>(Target);
    jwtService = Container.get(JWTService);
    user = await factory(User)().create();
    token = await jwtService.createJWT(user);
    createTargetDTO = await factory(CreateTargetDTO)().make();
  });

  it('all dependencies should be defined', () => {
    expect(jwtService).toBeDefined();
    expect(targetRepo).toBeDefined();
  });

  describe('createTarget', () => {
    beforeEach(async () => {
      user = await factory(User)().create();
      token = await jwtService.createJWT(user);
    });
    it('returns http code 401 without authentication token', async () => {
      const response = await request(app)
        .post(`${API}/targets`);
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(response.body).toStrictEqual(
        expect.objectContaining(new UnauthorizedError('POST /api/v1/targets'))
      );
    });

    it('returns http code 401 with an invalid authentication token', async () => {
      const invalidToken = faker.random.word();
      const response = await request(app)
        .post(`${API}/targets`)
        .set({ Authorization: invalidToken });
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(response.body).toStrictEqual(
        expect.objectContaining(new UnauthorizedError('POST /api/v1/targets'))
      );
    });

    it('returns http code 400 with 6 errors on the errors field', async () => {
      const response = await request(app)
        .post(`${API}/targets`)
        .set({ Authorization: token })
        .send({});
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST);

      expect(response.body).toStrictEqual({
        description: ErrorsMessages.BODY_ERRORS,
        httpCode: HttpStatusCode.BAD_REQUEST,
        errors: [
          TargetErrorsMessages.TARGET_TITLE_NOT_EMPTY,
          TargetErrorsMessages.TARGET_TITLE_STRING,
          TargetErrorsMessages.TARGET_TITLE_MIN_LENGTH,
          TargetErrorsMessages.TARGET_RADIUS_NOT_EMPTY,
          TargetErrorsMessages.TARGET_RADIUS_NUMBER,
          TargetErrorsMessages.TARGET_RADIUS_GREATER_0
        ],
        name: ErrorsMessages.BAD_REQUEST_ERROR
      });
    });

    it('returns http code 400 if creating more than 10 targets', async () => {
      for (let i = 0; i < 10; i++) {
        createTargetDTO = await factory(CreateTargetDTO)().make();
        await request(app)
          .post(`${API}/targets`)
          .set({ Authorization: token })
          .send(createTargetDTO);
      }
      const response = await request(app)
        .post(`${API}/targets`)
        .set({ Authorization: token })
        .send(createTargetDTO);
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST);
      expect(response.body.description).toContain(
        TargetErrorsMessages.TARGET_USER_MORE_10
      );
    });

    it('returns http code 200 and creates the target', async () => {
      const response = await request(app)
        .post(`${API}/targets`)
        .set({ Authorization: token })
        .send(createTargetDTO);
      expect(response.status).toBe(HttpStatusCode.OK);
      const targetRepo = getRepository<Target>(Target);
      expect(await targetRepo.count()).toBeGreaterThan(0);
    });
  });

  describe('listTargets', () => {
    beforeEach(async () => {
      user = await factory(User)().create();
      await factory(Target)().create({ userId: user.id });
      token = await jwtService.createJWT(user);
    });

    it('returns http code 401 without authentication token', async () => {
      const response = await request(app)
        .get(`${API}/targets`);
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(response.body).toStrictEqual(
        expect.objectContaining(new UnauthorizedError('GET /api/v1/targets'))
      );
    });

    it('returns http code 401 with an invalid authentication token', async () => {
      const invalidToken = faker.random.word();
      const response = await request(app)
        .get(`${API}/targets`)
        .set({ Authorization: invalidToken });
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(response.body).toStrictEqual(
        expect.objectContaining(new UnauthorizedError('GET /api/v1/targets'))
      );
    });

    it('returns http code 200 and retrieves the target list for the user', async () => {
      const response = await request(app)
        .get(`${API}/targets`)
        .set({ Authorization: token });
      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).not.toEqual([]);
      expect(response.body.every(
        (target: Target) => target.userId === user.id)
      ).toBe(true);
    });

    describe('deleteTarget', () => {
      beforeEach(async () => {
        user = await factory(User)().create();
        target = await factory(Target)().create({ userId: user.id });
        token = await jwtService.createJWT(user);
      });


      it('returns http code 401 without authentication token', async () => {
        const response = await request(app)
          .delete(`${API}/targets/${target.id}`);
        expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
        expect(response.body).toStrictEqual(
          expect.objectContaining(
            new UnauthorizedError(`DELETE /api/v1/targets/${target.id}`)
          )
        );
      });

      it('returns http code 401 with an invalid authentication token', async () => {
        const invalidToken = faker.random.word();
        const response = await request(app)
          .delete(`${API}/targets/${target.id}`)
          .set({ Authorization: invalidToken });
        expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
        expect(response.body).toStrictEqual(
          expect.objectContaining(
            new UnauthorizedError(`DELETE /api/v1/targets/${target.id}`)
          )
        );
      });

      it('returns http code 200 and deletes the target', async () => {
        const beforeCount = await targetRepo.count();

        const response = await request(app)
          .delete(`${API}/targets/${target.id}`)
          .set({ Authorization: token });
        expect(response.status).toBe(200);
        expect(await targetRepo.count()).toBeLessThan(beforeCount);
      });
    });
  });
});
