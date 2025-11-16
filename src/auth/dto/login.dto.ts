import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'O e-mail não pode ser vazio.' })
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  @MinLength(6, { message: 'Password must contain at least 6 characters.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'A senha deve conter letras maiúsculas, minúsculas e números',
  })
  password: string;
}
