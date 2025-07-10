import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, adminId?: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      lastEditedByAdminId: adminId,
    });
    return await this.taskRepository.save(task);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    completed?: boolean,
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [data, total] = await this.taskRepository.findAndCount({
      where: completed !== undefined ? { completed } : {},
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    adminId?: string,
  ): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateTaskDto, { lastEditedByAdminId: adminId });
    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async toggleComplete(id: string, adminId?: string): Promise<Task> {
    const task = await this.findOne(id);
    task.completed = !task.completed;
    if (adminId) {
      task.lastEditedByAdminId = adminId;
    }
    return await this.taskRepository.save(task);
  }

  async getCount(): Promise<number> {
    return await this.taskRepository.count();
  }

  async getCompletedCount(): Promise<number> {
    return await this.taskRepository.count({ where: { completed: true } });
  }

  async getPendingCount(): Promise<number> {
    return await this.taskRepository.count({ where: { completed: false } });
  }
}
