import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Cities (e2e)', () => {
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

  it('CRUD /cities as admin', async () => {
    const unique = Date.now();
    const createRes = await request(app.getHttpServer())
      .post('/cities')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ name: `City_${unique}`, region: 'R1' })
      .expect(201);
    const id = createRes.body.id;

    await request(app.getHttpServer())
      .patch(`/cities/${id}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ region: 'R2' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/cities/${id}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);
  });
});


