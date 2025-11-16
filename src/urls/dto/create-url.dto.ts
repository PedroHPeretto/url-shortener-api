import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
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
