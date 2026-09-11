import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    phone: '01012345678',
    email: 'test@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
    role: 'THERAPIST',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
              findFirst: jest.fn().mockResolvedValue(mockUser),
              create: jest.fn().mockResolvedValue(mockUser),
              update: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-jwt-token'),
            verify: jest.fn().mockReturnValue({ sub: 'test-user-id', role: 'THERAPIST' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      // Mock bcrypt compare
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('01012345678', 'password123');
      
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');
      
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('01012345678', 'wrongpassword');
      
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const result = await service.login(mockUser);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('test-jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        phone: mockUser.phone,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('register', () => {
    it('should create new user with hashed password', async () => {
      const registerDto = {
        name: 'New User',
        phone: '01098765432',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: 'PATIENT',
      };

      const result = await service.register(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...registerDto,
          passwordHash: expect.any(String),
        },
      });
    });
  });
});
