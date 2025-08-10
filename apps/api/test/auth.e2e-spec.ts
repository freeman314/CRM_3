import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/login (POST) - success', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    expect(response.body.access_token).toBeDefined();
    expect(response.body.refresh_token).toBeDefined();
    accessToken = response.body.access_token;
    refreshToken = response.body.refresh_token;
  });

  it('/auth/login (POST) - invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });

  it('/auth/refresh (POST) - success', async () => {
    // First login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    
    const userId = JSON.parse(Buffer.from(loginRes.body.access_token.split('.')[1], 'base64').toString()).sub;
    
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ userId, refreshToken: loginRes.body.refresh_token })
      .expect(201);

    expect(response.body.access_token).toBeDefined();
    expect(response.body.refresh_token).toBeDefined();
  });

  it('/auth/logout (POST) - success', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`)
      .expect(201);
  });
});
