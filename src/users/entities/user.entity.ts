import { Url } from '../../urls/entities/url.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class User {
  @ApiProperty({ example: 'user-uuid', description: 'Users id' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@email.com', description: 'Users email' })
  @Column()
  email: string;

  @ApiProperty({ example: 'Password123', description: 'Users password' })
  @Column()
  password: string;

  @ApiProperty({ type: () => Url, isArray: true, required: false })
  @OneToMany(() => Url, (url) => url.user)
  urls: Url[];

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  @DeleteDateColumn()
  deleted_at: Date | null;
}
