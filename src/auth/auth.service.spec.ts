import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

const mockUser: User = {
  id: 'some-uuid',
  email: 'teste@email.com',
  password: 'hashedPassword',
  urls: [],
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

const createUserDto: CreateUserDto = {
  email: 'teste@email.com',
  password: 'password123',
};

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
    mockUsersServiceFactory.findByEmail.mockReset();
    mockUsersServiceFactory.create.mockReset();
    mockJwtServiceFactory.signAsync.mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Register', () => {
    it('Should register a new user successfully', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUsersService.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(createUserDto);

      expect(mockUsersServiceFactory.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUsersServiceFactory.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        urls: mockUser.urls,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
        deleted_at: null,
      });
    });

    it('Should throw ConflictException if e-mail already exists', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockUsersServiceFactory.create).not.toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    const loginDto: LoginDto = {
      email: 'teste@email.com',
      password: 'password123',
    };

    const mockToken = 'mockJwtToken';

    it('Should return an access token on successfull login', async () => {
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

    it('Should throw UnauthorizedException if user does not exist', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('Should throw UnauthorizedException if password does not match', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
