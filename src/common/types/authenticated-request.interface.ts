import { Request } from 'express';
import { AdminRole } from '../../admins/entities/admin.entity';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: AdminRole;
    first_name: string;
  };
}
