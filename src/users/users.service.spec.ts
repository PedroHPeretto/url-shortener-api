import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockUser: User = {
  id: 'user-uuid',
  email: 'teste@email.com',
  password: 'password123',
  urls: [],
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: MockRepository<User>;

  const mockRepositoryFactory = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('Should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'teste@example.com',
        password: 'password123',
      };

      (mockUserRepository.create as jest.Mock).mockReturnValue(mockUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: createUserDto.password,
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('Should find a user by their email', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('teste@email.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'teste@email.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('Should return null if user does not exist', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@email.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('Should update a user successfully without password change', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      const updatedUser: User = {
        ...mockUser,
        email: 'newemail@example.com',
      };

      (mockUserRepository.preload as jest.Mock).mockResolvedValue(updatedUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update('user-uuid', updateUserDto);

      expect(mockUserRepository.preload).toHaveBeenCalledWith({
        id: 'user-uuid',
        email: 'newemail@example.com',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        urls: updatedUser.urls,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        deleted_at: updatedUser.deleted_at,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('Should update a user with password hashing', async () => {
      const updateUserDto: UpdateUserDto = {
        password: 'newpassword123',
      };

      const hashedPassword = 'hashedpassword123';
      const updatedUser: User = {
        ...mockUser,
        password: hashedPassword,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (mockUserRepository.preload as jest.Mock).mockResolvedValue(updatedUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update('user-uuid', updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockUserRepository.preload).toHaveBeenCalledWith({
        id: 'user-uuid',
        password: hashedPassword,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('Should throw NotFoundException if user does not exist', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      (mockUserRepository.preload as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('nonexistent-id', updateUserDto),
      ).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('remove', () => {
    it('Should soft delete a user successfully', async () => {
      (mockUserRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.remove('user-uuid');

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith('user-uuid');
    });

    it('Should throw NotFoundException if user does not exist', async () => {
      (mockUserRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 0,
      });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        'Usuário não encontrado',
      );
    });
  });
});
