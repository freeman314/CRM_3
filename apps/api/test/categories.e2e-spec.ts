import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let adminAccess: string;
  let chiefAccess: string;
  let createdId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    adminAccess = (await request(app.getHttpServer()).post('/auth/login').send({ username: 'admin', password: 'admin123' })).body.access_token;
    chiefAccess = (await request(app.getHttpServer()).post('/auth/login').send({ username: 'manager', password: 'manager123' })).body.access_token; // manager shouldn't create categories
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /categories - unauthorized without token', async () => {
    await request(app.getHttpServer()).get('/categories').expect(401);
  });

  it('POST /categories - only chief_manager/admin (manager should be 403)', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${chiefAccess}`)
      .send({ name: 'Should Fail' })
      .expect(403);
  });

  it('CRUD /categories as admin', async () => {
    const unique = Date.now();
    const createRes = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ name: `Cat_${unique}`, description: 'desc' })
      .expect(201);
    createdId = createRes.body.id;

    const listRes = await request(app.getHttpServer()).get('/categories').set('Authorization', `Bearer ${adminAccess}`).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/categories/${createdId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ description: 'updated' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/categories/${createdId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);
  });
});


