import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  describe('validate', () => {
    it('returns the authenticated user when found', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
        },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
      });
    });

    it('throws when the user no longer exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: 'missing-user',
          email: 'missing@example.com',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
