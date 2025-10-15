import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsNotEmpty() username: string;
  @IsEmail() email: string;
  @MinLength(8) password: string;
  full_name?: string;
  phone_number?: string;
}
