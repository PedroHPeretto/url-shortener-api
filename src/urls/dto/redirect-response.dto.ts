import { Expose, Exclude, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UrlRedirectResponse {
  @ApiProperty({
    example: 'https://google.com',
    description: 'Original url',
  })
  @Expose()
  @Transform(({ value }: { value: string | null }) => value, {
    toClassOnly: true,
  })
  url: string | null;

  constructor(url: string | null) {
    this.url = url;
  }
}
