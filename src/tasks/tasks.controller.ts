import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.create(createTaskDto, req.user?.id);
  }

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('completed') completed?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const completedBool =
      completed !== undefined ? completed === 'true' : undefined;

    return this.tasksService.findAll(pageNum, limitNum, completedBool);
  }

  @Get('count')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCount() {
    return this.tasksService.getCount();
  }

  @Get('count/completed')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getCompletedCount() {
    return this.tasksService.getCompletedCount();
  }

  @Get('count/pending')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  getPendingCount() {
    return this.tasksService.getPendingCount();
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user?.id);
  }

  @Patch(':id/toggle')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  toggleComplete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.toggleComplete(id, req.user?.id);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
