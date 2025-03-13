import { UserRepository } from './user.repository';
import { AuthRepository} from './auth.repository';

export const userRepository = new UserRepository();
export const authRepository = new AuthRepository();


export { UserRepository, AuthRepository };

