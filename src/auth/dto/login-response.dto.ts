import { Expose, Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class LoginResponseDto {
  @ApiProperty({ example: 'oihiuhijn2uhhn', description: 'Jwt Bearer token' })
  @Expose()
  access_token: string;
}
