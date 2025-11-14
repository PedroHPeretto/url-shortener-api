import { PartialType } from '@nestjs/mapped-types';
import { CreateUrlDto } from './create-url.dto';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateUrlDto extends PartialType(CreateUrlDto) {
  @IsNotEmpty({ message: 'A url não pode ser vazia.' })
  @IsUrl(
    {
      require_protocol: true,
    },
    {
      message:
        'A url fornecida não é valida. Certifique-se de ter incluido o protocolo (ex: https://)',
    },
  )
  original_url: string;
}
