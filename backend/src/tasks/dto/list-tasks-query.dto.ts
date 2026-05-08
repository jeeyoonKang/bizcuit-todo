import { IsIn, IsOptional } from 'class-validator';

export class ListTasksQueryDto {
  @IsOptional()
  @IsIn(['all', 'active', 'done', 'overdue'])
  status?: 'all' | 'active' | 'done' | 'overdue';

  @IsOptional()
  @IsIn(['newest', 'deadlineAsc'])
  sort?: 'newest' | 'deadlineAsc';
}
