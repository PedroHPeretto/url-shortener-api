import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: 'user-uuid', description: 'Users ID' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@email.com', description: 'Users email' })
  email: string;

  @ApiProperty({ example: '11/17/2025', description: 'Users creation date' })
  @Expose()
  created_at: Date;
}
