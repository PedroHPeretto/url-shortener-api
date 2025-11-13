import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'O e-mail não pode ser vazio.' })
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  password: string;
}
