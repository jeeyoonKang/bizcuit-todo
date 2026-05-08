import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('delegates register to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };
    authService.register.mockResolvedValue({
      accessToken: 'signed-token',
    });

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      accessToken: 'signed-token',
    });
  });

  it('delegates login to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };
    authService.login.mockResolvedValue({
      accessToken: 'signed-token',
    });

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      accessToken: 'signed-token',
    });
  });
});
