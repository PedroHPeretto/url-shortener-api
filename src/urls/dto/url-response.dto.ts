import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Exclude()
export class UrlResponseDto {
  @ApiProperty({ example: 'url-uuid', description: 'Url ID' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'url-uuid', description: 'Url ID' })
  @Expose()
  original_url: string;

  @ApiProperty({ example: 'url-uuid', description: 'Url ID' })
  @Expose()
  short_url: string;

  @ApiProperty({ example: 'url-uuid', description: 'Url ID' })
  @Expose()
  user: User;
}
