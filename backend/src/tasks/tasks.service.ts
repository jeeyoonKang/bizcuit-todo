import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        done: dto.done ?? false,
        userId: user.id,
      },
    });
  }

  async findAll(user: AuthUser, query: ListTasksQueryDto) {
    const where: Prisma.TaskWhereInput = {
      userId: user.id,
    };

    if (query.status === 'active') {
      where.done = false;
    }

    if (query.status === 'done') {
      where.done = true;
    }

    if (query.status === 'overdue') {
      where.done = false;
      where.deadline = {
        lt: new Date(),
      };
    }

    let orderBy: Prisma.TaskOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    if (query.sort === 'deadlineAsc') {
      orderBy = {
        deadline: 'asc',
      };
    }

    return this.prisma.task.findMany({
      where,
      orderBy,
    });
  }

  async findOne(user: AuthUser, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(user: AuthUser, taskId: string, dto: UpdateTaskDto) {
    const result = await this.prisma.task.updateMany({
      where: {
        id: taskId,
        userId: user.id,
      },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),

        ...(dto.description !== undefined && {
          description: dto.description?.trim() ?? null,
        }),

        ...(dto.deadline !== undefined && {
          deadline: dto.deadline ? new Date(dto.deadline) : null,
        }),

        ...(dto.done !== undefined && {
          done: dto.done,
        }),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return this.findOne(user, taskId);
  }

  async remove(user: AuthUser, taskId: string) {
    const result = await this.prisma.task.deleteMany({
      where: {
        id: taskId,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return {
      success: true,
    };
  }
}
