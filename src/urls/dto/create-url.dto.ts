import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'A url não pode ser vazia.' })
  @IsUrl({}, { message: 'A url fornecida é invalida.' })
  original_url: string;
}
