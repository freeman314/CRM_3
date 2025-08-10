import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Calls (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let managerUserId: string;
  let clientId: string;

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

    // Login as manager
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'manager', password: 'manager123' });
    accessToken = loginRes.body.access_token;
    managerUserId = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString()).sub;

    // Create a client to call
    const unique = Date.now();
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Alice', lastName: 'Smith', email: `alice.smith+${unique}@example.com` });
    clientId = clientRes.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('/calls (POST) - create call', async () => {
    const res = await request(app.getHttpServer())
      .post('/calls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        managerId: managerUserId,
        result: 'successful',
        comment: 'Reached the client successfully',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.result).toBe('successful');
  });

  it('/calls/client/:clientId (GET) - list client calls', async () => {
    await request(app.getHttpServer())
      .post('/calls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ clientId, managerId: managerUserId, result: 'no_answer' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/calls/client/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});


