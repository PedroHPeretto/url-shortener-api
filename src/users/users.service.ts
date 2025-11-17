import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserResponse } from './interfaces/user-response.type';
import { AUTH_CONSTANTS } from '../auth/constants/auth.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      this.logger.warn(`Email provided already in use: ${createUserDto.email}`);
      throw new ConflictException('Email provided already in use');
    }

    const user = this.userRepository.create(createUserDto);

    this.logger.log(`User: ${user.id} created successfully`);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`User email: ${email} searched successfully`);
    return this.userRepository.findOne({ where: { email } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const userExists = await this.userRepository.findOne({ where: { id } });
    if (!userExists) {
      this.logger.warn(`User: ${id} not found`);
      throw new NotFoundException(`User: ${id} not found`);
    }

    const updateData = { ...updateUserDto };
    if (updateData.password) {
      try {
        updateData.password = await bcrypt.hash(
          updateData.password,
          AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS,
        );
      } catch {
        this.logger.error(`Failed to update user information`);
        throw new InternalServerErrorException('Failed to process password');
      }
    }

    const user = await this.userRepository.preload({
      id,
      ...updateData,
    });

    if (!user) {
      this.logger.warn(`User: ${id} not found`);
      throw new NotFoundException('User not found');
    }

    const savedUser = await this.userRepository.save(user);

    const { password: _, ...result } = savedUser;

    this.logger.log(`User: ${savedUser.id} updated successfully`);
    return result;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    if (result.affected === 0) {
      this.logger.warn(`User: ${id} could not be deleted`);
      throw new NotFoundException('User not found');
    }
  }
}
