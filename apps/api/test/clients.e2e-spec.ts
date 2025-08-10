import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Clients (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

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

    // Login as manager (has permission to create clients)
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'manager', password: 'manager123' });
    accessToken = loginRes.body.access_token;
    

  });

  afterEach(async () => {
    await app.close();
  });

  it('/clients (GET) - success', async () => {
    const response = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toBeDefined();
    expect(response.body.total).toBeDefined();
  });

  it('/clients (POST) - create client', async () => {
    const unique = Date.now();
    const clientData = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe+${unique}@example.com`,
      phone: '+1234567890',
    };

    const response = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(clientData);

    if (response.status !== 201) {
      console.log('Error response:', response.status, response.body);
    }
    expect(response.status).toBe(201);
    expect(response.body.firstName).toBe(clientData.firstName);
    expect(response.body.lastName).toBe(clientData.lastName);
    expect(response.body.email).toBe(clientData.email);
  });

  it('/clients (GET) - filter by search', async () => {
    const response = await request(app.getHttpServer())
      .get('/clients?q=john')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toBeDefined();
  });

  it('/clients (GET) - unauthorized', () => {
    return request(app.getHttpServer())
      .get('/clients')
      .expect(401);
  });
});
