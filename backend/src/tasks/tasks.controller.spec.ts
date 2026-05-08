import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;

  const tasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const user = {
    id: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TasksController(tasksService as unknown as TasksService);
  });

  it('delegates create to TasksService', async () => {
    const dto = { title: 'Test task' };
    tasksService.create.mockResolvedValue({ id: 'task-1' });

    const result = await controller.create(user, dto);

    expect(tasksService.create).toHaveBeenCalledWith(user, dto);
    expect(result).toEqual({ id: 'task-1' });
  });

  it('delegates findAll to TasksService', async () => {
    const query = { status: 'active' as const };
    tasksService.findAll.mockResolvedValue([{ id: 'task-1' }]);

    const result = await controller.findAll(user, query);

    expect(tasksService.findAll).toHaveBeenCalledWith(user, query);
    expect(result).toEqual([{ id: 'task-1' }]);
  });

  it('delegates findOne to TasksService', async () => {
    tasksService.findOne.mockResolvedValue({ id: 'task-1' });

    const result = await controller.findOne(
      user,
      '11111111-1111-1111-1111-111111111111',
    );

    expect(tasksService.findOne).toHaveBeenCalledWith(
      user,
      '11111111-1111-1111-1111-111111111111',
    );
    expect(result).toEqual({ id: 'task-1' });
  });

  it('delegates update to TasksService', async () => {
    const dto = { title: 'Updated task' };
    tasksService.update.mockResolvedValue({ id: 'task-1' });

    const result = await controller.update(
      user,
      '11111111-1111-1111-1111-111111111111',
      dto,
    );

    expect(tasksService.update).toHaveBeenCalledWith(
      user,
      '11111111-1111-1111-1111-111111111111',
      dto,
    );
    expect(result).toEqual({ id: 'task-1' });
  });

  it('marks a task as done', async () => {
    tasksService.update.mockResolvedValue({ id: 'task-1', done: true });

    const result = await controller.markDone(
      user,
      '11111111-1111-1111-1111-111111111111',
    );

    expect(tasksService.update).toHaveBeenCalledWith(
      user,
      '11111111-1111-1111-1111-111111111111',
      { done: true },
    );
    expect(result).toEqual({ id: 'task-1', done: true });
  });

  it('marks a task as undone', async () => {
    tasksService.update.mockResolvedValue({ id: 'task-1', done: false });

    const result = await controller.markUndone(
      user,
      '11111111-1111-1111-1111-111111111111',
    );

    expect(tasksService.update).toHaveBeenCalledWith(
      user,
      '11111111-1111-1111-1111-111111111111',
      { done: false },
    );
    expect(result).toEqual({ id: 'task-1', done: false });
  });

  it('delegates remove to TasksService', async () => {
    tasksService.remove.mockResolvedValue({ success: true });

    const result = await controller.remove(
      user,
      '11111111-1111-1111-1111-111111111111',
    );

    expect(tasksService.remove).toHaveBeenCalledWith(
      user,
      '11111111-1111-1111-1111-111111111111',
    );
    expect(result).toEqual({ success: true });
  });
});
