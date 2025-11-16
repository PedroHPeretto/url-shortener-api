import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email já está registrado');
    }

    const user = this.userRepository.create(createUserDto);

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const userExists = await this.userRepository.findOne({ where: { id } });
    if (!userExists) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    const updateData = { ...updateUserDto };
    if (updateData.password) {
      try {
        updateData.password = await bcrypt.hash(
          updateData.password,
          AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS,
        );
      } catch {
        throw new InternalServerErrorException('Falha ao processar senha');
      }
    }

    const user = await this.userRepository.preload({
      id,
      ...updateData,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const savedUser = await this.userRepository.save(user);

    const { password: _, ...result } = savedUser;

    return result;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }
}
