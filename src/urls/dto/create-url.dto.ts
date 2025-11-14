import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'A url não pode ser vazia.' })
  @IsUrl(
    {
      require_protocol: true,
    },
    {
      message:
        'A url fornecida é invalida. Certifique-se de ter incluido o protocolo (ex: https://)',
    },
  )
  original_url: string;
}
