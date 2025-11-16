import { PartialType } from '@nestjs/mapped-types';
import { CreateUrlDto } from './create-url.dto';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateUrlDto extends PartialType(CreateUrlDto) {
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
