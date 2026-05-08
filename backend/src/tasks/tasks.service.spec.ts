import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  const prisma = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const user = {
    id: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a task for the authenticated user', async () => {
      prisma.task.create.mockResolvedValue({
        id: 'task-1',
        title: 'Test task',
      });

      const result = await service.create(user, {
        title: ' Test task ',
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Test task',
          description: null,
          deadline: null,
          done: false,
          userId: 'user-1',
        },
      });

      expect(result).toEqual({
        id: 'task-1',
        title: 'Test task',
      });
    });

    it('maps optional fields when provided', async () => {
      prisma.task.create.mockResolvedValue({
        id: 'task-1',
      });

      await service.create(user, {
        title: ' Test task ',
        description: ' Notes ',
        deadline: '2026-05-10T12:00:00.000Z',
        done: true,
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Test task',
          description: 'Notes',
          deadline: new Date('2026-05-10T12:00:00.000Z'),
          done: true,
          userId: 'user-1',
        },
      });
    });
  });

  describe('findAll', () => {
    it('returns tasks ordered by created date by default', async () => {
      prisma.task.findMany.mockResolvedValue([{ id: 'task-1' }]);

      const result = await service.findAll(user, {});

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual([{ id: 'task-1' }]);
    });

    it('filters active tasks', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(user, { status: 'active' });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          done: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('filters completed tasks', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(user, { status: 'done' });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          done: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('filters overdue tasks', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(user, { status: 'overdue' });

      const [call] = prisma.task.findMany.mock.calls[0] as [
        {
          where: {
            userId: string;
            done: boolean;
            deadline?: { lt: Date };
          };
          orderBy: {
            createdAt: 'desc';
          };
        },
      ];

      expect(call.where.userId).toBe('user-1');
      expect(call.where.done).toBe(false);
      expect(call.where.deadline?.lt).toBeInstanceOf(Date);
      expect(call.orderBy).toEqual({
        createdAt: 'desc',
      });
    });

    it('sorts by deadline when requested', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(user, { sort: 'deadlineAsc' });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        orderBy: {
          deadline: 'asc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('returns task when owned by user', async () => {
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
      });

      const result = await service.findOne(user, 'task-1');

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          userId: 'user-1',
        },
      });

      expect(result).toEqual({
        id: 'task-1',
      });
    });

    it('throws when task does not exist', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne(user, 'missing-task')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates provided task fields and returns the updated task', async () => {
      prisma.task.updateMany.mockResolvedValue({
        count: 1,
      });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        title: 'Updated task',
        description: 'Updated notes',
        done: true,
      });

      const result = await service.update(user, 'task-1', {
        title: ' Updated task ',
        description: ' Updated notes ',
        deadline: '2026-05-10T12:00:00.000Z',
        done: true,
      });

      expect(prisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          userId: 'user-1',
        },
        data: {
          title: 'Updated task',
          description: 'Updated notes',
          deadline: new Date('2026-05-10T12:00:00.000Z'),
          done: true,
        },
      });
      expect(result).toEqual({
        id: 'task-1',
        title: 'Updated task',
        description: 'Updated notes',
        done: true,
      });
    });

    it('clears nullable fields when explicitly set', async () => {
      prisma.task.updateMany.mockResolvedValue({
        count: 1,
      });
      prisma.task.findFirst.mockResolvedValue({
        id: 'task-1',
        description: null,
        deadline: null,
      });

      await service.update(user, 'task-1', {
        description: null,
        deadline: null,
      });

      expect(prisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          userId: 'user-1',
        },
        data: {
          description: null,
          deadline: null,
        },
      });
    });

    it('throws when task does not exist', async () => {
      prisma.task.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.update(user, 'missing-task', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes owned task', async () => {
      prisma.task.deleteMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.remove(user, 'task-1');

      expect(prisma.task.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          userId: 'user-1',
        },
      });

      expect(result).toEqual({
        success: true,
      });
    });

    it('throws when task does not exist or is not owned by user', async () => {
      prisma.task.deleteMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.remove(user, 'missing-task')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
