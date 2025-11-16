import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { createMockUser } from '../../test/fixtures/users.fixture';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;

  const mockUsersServiceFactory = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtServiceFactory = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(mockUsersServiceFactory).forEach((mock) => mock.mockClear());
    Object.values(mockJwtServiceFactory).forEach((mock) => mock.mockClear());
    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.compare as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersServiceFactory,
        },
        {
          provide: JwtService,
          useValue: mockJwtServiceFactory,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUsersService = mockUsersServiceFactory;
    mockJwtService = mockJwtServiceFactory;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const mockUser = createMockUser(createUserDto);
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(createUserDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        urls: mockUser.urls,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
        deleted_at: mockUser.deleted_at,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = createMockUser(createUserDto);
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(
        existingUser,
      );

      const error = await service
        .register(createUserDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hash error', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash failed'));

      const error = await service
        .register(createUserDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Hash failed');
    });

    it('should handle user creation error', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockUsersService.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service
        .register(createUserDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Database error');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    const mockToken = 'mock.jwt.token';

    it('should return access token on successful login', async () => {
      const mockUser = createMockUser({ email: loginDto.email });
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.signAsync as jest.Mock).mockResolvedValue(mockToken);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ access_token: mockToken });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const error = await service.login(loginDto).catch((e: Error) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const mockUser = createMockUser({ email: loginDto.email });
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const error = await service.login(loginDto).catch((e: Error) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle JWT signing error', async () => {
      const mockUser = createMockUser({ email: loginDto.email });
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwtService.signAsync as jest.Mock).mockRejectedValue(
        new Error('JWT error'),
      );

      const error = await service.login(loginDto).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('JWT error');
    });
  });
});
