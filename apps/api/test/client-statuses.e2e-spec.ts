import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Client Statuses (e2e)', () => {
  let app: INestApplication;
  let adminAccess: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    adminAccess = (await request(app.getHttpServer()).post('/auth/login').send({ username: 'admin', password: 'admin123' })).body.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('CRUD /client-statuses as admin', async () => {
    const unique = Date.now();
    const createRes = await request(app.getHttpServer())
      .post('/client-statuses')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ name: `Status_${unique}`, description: 'desc' })
      .expect(201);
    const id = createRes.body.id;

    await request(app.getHttpServer())
      .patch(`/client-statuses/${id}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ description: 'updated' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/client-statuses/${id}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);
  });
});


