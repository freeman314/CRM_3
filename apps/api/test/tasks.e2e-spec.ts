import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let access: string;
  let clientId: string;
  let assignedToId: string;
  let taskId: string;
  let adminAccess: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ username: 'manager', password: 'manager123' });
    access = loginRes.body.access_token;
    assignedToId = JSON.parse(Buffer.from(access.split('.')[1], 'base64').toString()).sub;

    adminAccess = (
      await request(app.getHttpServer()).post('/auth/login').send({ username: 'admin', password: 'admin123' })
    ).body.access_token;

    // create client
    const cRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${access}`)
      .send({ firstName: 'T', lastName: 'User', email: `tuser+${Date.now()}@example.com` });
    clientId = cRes.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('CRUD task', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${access}`)
      .send({ title: 'Follow up', clientId, assignedToId })
      .expect(201);
    taskId = createRes.body.id;

    await request(app.getHttpServer()).get('/tasks').set('Authorization', `Bearer ${access}`).expect(200);

    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${access}`)
      .send({ status: 'completed' })
      .expect(200);

    // Manager cannot delete per role policy
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${access}`)
      .expect(403);

    // Admin can delete
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);
  });
});


