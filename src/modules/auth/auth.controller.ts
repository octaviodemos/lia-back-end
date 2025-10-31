import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private service: AuthService) {}

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;
      const result = await this.service.login(email, senha);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }
}