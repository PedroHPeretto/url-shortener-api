import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      this.logger.warn(
        `Registration failed: email ${createUserDto.email} already in use`,
      );
      throw new ConflictException('The email provided is already in use');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS,
    );

    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const { password: _, ...result } = user;

    this.logger.log(`User registered successfully: ${user.id}`);
    return result;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Login failed, user not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatching) {
      this.logger.warn(
        `Login failed, password incorrect for user: ${user.email}`,
      );
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { sub: user.id, email: user.email };

    this.logger.log(`User: ${user.id} logged in successfully`);
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
