import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Url } from '../entities/url.entity';

@Exclude()
export class UserUrlsResponseDto {
  @ApiProperty({ example: 'url1, url2...', description: 'Array of users urls' })
  @Expose()
  urls: Url[];
}
