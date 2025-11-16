import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  @IsEmail({}, { message: 'Email provided is invalid' })
  email: string;

  @IsNotEmpty({ message: 'Password cannot be empty.' })
  @MinLength(6, { message: 'Password must contain at least 6 characters.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'A senha deve conter letras maiúsculas, minúsculas e números',
  })
  password: string;
}
