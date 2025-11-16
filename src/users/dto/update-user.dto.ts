import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email provided is invalid' })
  email?: string | undefined;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must contain at least 6 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'A senha deve conter letras maiúsculas, minúsculas e números',
  })
  password?: string | undefined;
}
