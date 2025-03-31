import { UserController } from './user.controller';
import { AuthController } from './auth.controller';

export const authController = new AuthController();
export const userController = new UserController();

export { UserController, AuthController };
