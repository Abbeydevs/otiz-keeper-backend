import { Request } from 'express';

interface UserPayload {
  userId: string;
  email: string;
  role: 'TALENT' | 'EMPLOYER' | 'ADMIN';
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
