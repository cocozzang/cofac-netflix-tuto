import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDirectorDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dob?: Date;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nationality?: string;
}
