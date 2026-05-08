import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  done: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

function createPrismaMock() {
  const users: UserRecord[] = [];
  const tasks: TaskRecord[] = [];

  const pickFields = <T extends object>(
    record: T,
    select?: Record<string, boolean>,
  ) => {
    if (!select) {
      return record;
    }

    const result: Record<string, unknown> = {};

    for (const key of Object.keys(select)) {
      if (select[key]) {
        result[key] = record[key as keyof T];
      }
    }

    return result;
  };

  return {
    user: {
      findUnique: jest.fn(async ({ where, select }) => {
        const user = users.find((entry) => {
          if (where.id) {
            return entry.id === where.id;
          }

          if (where.email) {
            return entry.email === where.email;
          }

          return false;
        });

        return user ? pickFields(user, select) : null;
      }),

      create: jest.fn(async ({ data, select }) => {
        const user: UserRecord = {
          id: randomUUID(),
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        users.push(user);

        return pickFields(user, select);
      }),
    },

    task: {
      create: jest.fn(async ({ data }) => {
        const task: TaskRecord = {
          id: randomUUID(),
          title: data.title,
          description: data.description ?? null,
          deadline: data.deadline ?? null,
          done: data.done ?? false,
          userId: data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        tasks.push(task);

        return task;
      }),

      findMany: jest.fn(async ({ where, orderBy }) => {
        let result = tasks.filter((task) => task.userId === where.userId);

        if (where.done !== undefined) {
          result = result.filter((task) => task.done === where.done);
        }

        if (where.deadline?.lt) {
          result = result.filter(
            (task) =>
              task.deadline !== null && task.deadline < where.deadline.lt,
          );
        }

        if (orderBy?.deadline === 'asc') {
          result = [...result].sort((left, right) => {
            if (!left.deadline && !right.deadline) {
              return 0;
            }

            if (!left.deadline) {
              return 1;
            }

            if (!right.deadline) {
              return -1;
            }

            return left.deadline.getTime() - right.deadline.getTime();
          });
        } else {
          result = [...result].sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          );
        }

        return result;
      }),

      findFirst: jest.fn(async ({ where }) => {
        return (
          tasks.find(
            (task) => task.id === where.id && task.userId === where.userId,
          ) ?? null
        );
      }),

      updateMany: jest.fn(async ({ where, data }) => {
        let count = 0;

        for (const task of tasks) {
          if (task.id === where.id && task.userId === where.userId) {
            if (data.title !== undefined) {
              task.title = data.title;
            }

            if (data.description !== undefined) {
              task.description = data.description;
            }

            if (data.deadline !== undefined) {
              task.deadline = data.deadline;
            }

            if (data.done !== undefined) {
              task.done = data.done;
            }

            task.updatedAt = new Date();
            count += 1;
          }
        }

        return { count };
      }),

      deleteMany: jest.fn(async ({ where }) => {
        const originalLength = tasks.length;

        for (let index = tasks.length - 1; index >= 0; index -= 1) {
          if (
            tasks[index].id === where.id &&
            tasks[index].userId === where.userId
          ) {
            tasks.splice(index, 1);
          }
        }

        return {
          count: originalLength - tasks.length,
        };
      }),
    },
  };
}

describe('App (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    prismaMock = createPrismaMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const registerUser = async (email: string, password = 'password123') => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    return response.body;
  };

  describe('Auth', () => {
    it('POST /auth/register returns accessToken and user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'test@example.com',
        },
      });
    });

    it('POST /auth/login returns accessToken', async () => {
      await registerUser('test@example.com');

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: 'test@example.com',
        },
      });
    });

    it('POST /auth/login with wrong password returns 401', async () => {
      await registerUser('test@example.com');

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  describe('Tasks', () => {
    it('GET /tasks without token returns 401', async () => {
      await request(app.getHttpServer()).get('/tasks').expect(401);
    });

    it('POST /tasks with token creates task', async () => {
      const auth = await registerUser('owner@example.com');

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Write tests',
          description: 'Add minimal e2e coverage',
        })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        title: 'Write tests',
        description: 'Add minimal e2e coverage',
        deadline: null,
        done: false,
        userId: auth.user.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('POST /tasks rejects unknown fields', async () => {
      const auth = await registerUser('owner@example.com');

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Valid title',
          userId: 'someone-else',
        })
        .expect(400);
    });

    it('POST /tasks rejects invalid deadline', async () => {
      const auth = await registerUser('owner@example.com');

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Invalid deadline task',
          deadline: 'not-a-date',
        })
        .expect(400);
    });

    it('POST /tasks rejects invalid done type', async () => {
      const auth = await registerUser('owner@example.com');

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Invalid done task',
          done: 'yes',
        })
        .expect(400);
    });

    it("GET /tasks with token lists only that user's tasks", async () => {
      const firstUser = await registerUser('first@example.com');
      const secondUser = await registerUser('second@example.com');

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .send({
          title: 'First user task',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${secondUser.accessToken}`)
        .send({
          title: 'Second user task',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        title: 'First user task',
        userId: firstUser.user.id,
      });
    });

    it('GET /tasks supports status=done filter', async () => {
      const auth = await registerUser('owner@example.com');

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Active task',
          done: false,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Done task',
          done: true,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tasks?status=done')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        title: 'Done task',
        done: true,
      });
    });

    it('GET /tasks supports deadlineAsc sorting', async () => {
      const auth = await registerUser('owner@example.com');

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Later task',
          deadline: '2030-01-02T00:00:00.000Z',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Earlier task',
          deadline: '2030-01-01T00:00:00.000Z',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tasks?sort=deadlineAsc')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .expect(200);

      expect(response.body.map((task: TaskRecord) => task.title)).toEqual([
        'Earlier task',
        'Later task',
      ]);
    });

    it('GET /tasks rejects invalid status query', async () => {
      const auth = await registerUser('owner@example.com');

      await request(app.getHttpServer())
        .get('/tasks?status=invalid')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .expect(400);
    });

    it('PATCH /tasks/:id updates owned task', async () => {
      const auth = await registerUser('owner@example.com');

      const createdTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Original title',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${createdTask.body.id}`)
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Updated title',
          done: true,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdTask.body.id,
        title: 'Updated title',
        done: true,
        userId: auth.user.id,
      });
    });

    it('PATCH /tasks/:id rejects unknown fields', async () => {
      const auth = await registerUser('owner@example.com');

      const createdTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Original title',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/tasks/${createdTask.body.id}`)
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          userId: 'someone-else',
        })
        .expect(400);
    });

    it('GET /tasks/:id returns 404 for another user task', async () => {
      const owner = await registerUser('owner@example.com');
      const otherUser = await registerUser('other@example.com');

      const createdTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Private task',
        })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/tasks/${createdTask.body.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);
    });

    it('PATCH /tasks/:id returns 404 for another user task', async () => {
      const owner = await registerUser('owner@example.com');
      const otherUser = await registerUser('other@example.com');

      const createdTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Private task',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/tasks/${createdTask.body.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({
          title: 'Hacked title',
        })
        .expect(404);
    });

    it('DELETE /tasks/:id returns 404 for another user task', async () => {
      const owner = await registerUser('owner@example.com');
      const otherUser = await registerUser('other@example.com');

      const createdTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          title: 'Private task',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/tasks/${createdTask.body.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);
    });

    it('DELETE /tasks/:id deletes owned task', async () => {
      const auth = await registerUser('owner@example.com');

      const createdTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({
          title: 'Delete me',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/tasks/${createdTask.body.id}`)
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .expect(200)
        .expect({
          success: true,
        });

      const listResponse = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .expect(200);

      expect(listResponse.body).toEqual([]);
    });
  });
});
