import { Expose, Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UrlRedirectResponse {
  @ApiProperty({ example: 'https://google.com', description: 'Original url' })
  @Expose()
  original_url: string;
}
