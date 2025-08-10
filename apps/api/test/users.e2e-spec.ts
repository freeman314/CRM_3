import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Users admin (e2e)', () => {
  let app: INestApplication;
  let adminAccess: string;
  let managerAccess: string;
  let createdUserId: string;
  let deactivatedUserId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Login as admin and manager from seed
    adminAccess = (
      await request(app.getHttpServer()).post('/auth/login').send({ username: 'admin', password: 'admin123' })
    ).body.access_token;
    managerAccess = (
      await request(app.getHttpServer()).post('/auth/login').send({ username: 'manager', password: 'manager123' })
    ).body.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /users (admin only)', async () => {
    await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${adminAccess}`).expect(200);
    await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${managerAccess}`).expect(403);
  });

  it('POST /users (create new user)', async () => {
    const unique = Date.now();
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ username: `new_${unique}`, email: `new_${unique}@example.com`, role: 'manager', password: 'pass1234' })
      .expect(201);
    expect(res.body.id).toBeDefined();
    createdUserId = res.body.id;
  });

  it('PATCH /users/:id (prevent self role change)', async () => {
    // Attempt to change own role as admin
    await request(app.getHttpServer())
      .patch('/users/' + JSON.parse(Buffer.from(adminAccess.split('.')[1], 'base64').toString()).sub)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ role: 'manager' })
      .expect(403);
  });

  it('DELETE /users/:id (prevent self delete)', async () => {
    await request(app.getHttpServer())
      .delete('/users/' + JSON.parse(Buffer.from(adminAccess.split('.')[1], 'base64').toString()).sub)
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(403);
  });

  it('PATCH /users/:id (deactivate user) and ensure login blocked', async () => {
    const unique = Date.now();
    const create = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ username: `deact_${unique}`, email: `deact_${unique}@example.com`, role: 'manager', password: 'pass1234' })
      .expect(201);
    deactivatedUserId = create.body.id;
    await request(app.getHttpServer())
      .patch('/users/' + deactivatedUserId)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ active: false })
      .expect(200);

    // Try to login
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: `deact_${unique}`, password: 'pass1234' })
      .expect(403);
  });
});


