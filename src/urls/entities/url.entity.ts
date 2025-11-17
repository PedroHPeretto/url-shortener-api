import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'urls' })
export class Url {
  @ApiProperty({ example: 'uuid', description: 'Url id' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'https://google.com', description: 'Original url' })
  @Column()
  original_url: string;

  @ApiProperty({ example: 'abc123', description: 'Url short code' })
  @Column({ unique: true })
  short_code: string;

  @ApiProperty({ example: 0, description: 'Click count' })
  @Column({ default: 0 })
  click_count: number;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, (user) => user.urls, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'user-uuid', required: false })
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

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
