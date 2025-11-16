import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createMockRepository,
  MockRepository,
} from '../../test/helpers/mock-repository';
import { createMockUser } from '../../test/fixtures/users.fixture';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: MockRepository<User>;

  const mockRepositoryFactory = createMockRepository<User>();

  beforeEach(async () => {
    Object.values(mockRepositoryFactory).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear();
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositoryFactory,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockUserRepository = mockRepositoryFactory;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'teste@example.com',
        password: 'password123',
      };
      const mockUser = createMockUser(createUserDto);

      (mockUserRepository.create as jest.Mock).mockReturnValue(mockUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle create repository error', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (mockUserRepository.create as jest.Mock).mockReturnValue({});
      (mockUserRepository.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service.create(createUserDto).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser = createMockUser();
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      (mockUserRepository.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service
        .findByEmail('test@example.com')
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('update', () => {
    it('should update user email', async () => {
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };
      const baseUser = createMockUser({ id: userId });
      const updatedUser = createMockUser({
        ...baseUser,
        email: updateUserDto.email,
      });

      (mockUserRepository.preload as jest.Mock).mockResolvedValue(updatedUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(mockUserRepository.preload).toHaveBeenCalledWith({
        id: userId,
        email: updateUserDto.email,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result.email).toEqual(updateUserDto.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should hash password when updating password', async () => {
      const userId = 'user-uuid';
      const newPassword = 'newpassword123';
      const hashedPassword = 'hashedpassword123';
      const updateUserDto: UpdateUserDto = { password: newPassword };
      const baseUser = createMockUser({ id: userId });
      const updatedUser = createMockUser({
        ...baseUser,
        password: hashedPassword,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (mockUserRepository.preload as jest.Mock).mockResolvedValue(updatedUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUserRepository.preload).toHaveBeenCalledWith({
        id: userId,
        password: hashedPassword,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };
      (mockUserRepository.preload as jest.Mock).mockResolvedValue(null);

      const error = await service
        .update('nonexistent-id', updateUserDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as Error).message).toBe('Usuário não encontrado');
    });

    it('should handle password hash error', async () => {
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = { password: 'newpass' };

      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash failed'));

      const error = await service
        .update(userId, updateUserDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Hash failed');
    });

    it('should not hash password if not provided in update', async () => {
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = { email: 'new@example.com' };
      const updatedUser = createMockUser({
        id: userId,
        email: updateUserDto.email,
      });

      (mockUserRepository.preload as jest.Mock).mockResolvedValue(updatedUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      await service.update(userId, updateUserDto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      const userId = 'user-uuid';
      (mockUserRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.remove(userId);

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'nonexistent-id';
      (mockUserRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 0,
      });

      const error = await service.remove(userId).catch((e: Error) => e);

      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as Error).message).toBe('Usuário não encontrado');
    });

    it('should handle softDelete database error', async () => {
      const userId = 'user-uuid';
      (mockUserRepository.softDelete as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service.remove(userId).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Database error');
    });
  });
});
