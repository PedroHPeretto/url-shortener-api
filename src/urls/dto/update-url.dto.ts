import { PartialType } from '@nestjs/mapped-types';
import { CreateUrlDto } from './create-url.dto';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateUrlDto extends PartialType(CreateUrlDto) {
  @IsNotEmpty({ message: 'A url não pode ser vazia.' })
  @IsUrl({}, { message: 'A url fornecida não é valida.' })
  original_url: string;
}
