import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({
    example: 'https://google.com',
    description: 'Original url to be shortened',
  })
  @IsNotEmpty({ message: 'Url cannot be empty.' })
  @IsUrl(
    {
      require_protocol: true,
    },
    {
      message:
        'Url provided is invalid. Make sure it looks like this (ex: https://)',
    },
  )
  original_url: string;
}
