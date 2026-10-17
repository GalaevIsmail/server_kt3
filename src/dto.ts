import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
export class CreateUserDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
}
export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
}
export class CreatePostDto {
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() @MinLength(1) content!: string;
  @IsInt() @Min(1) authorId!: number;
}
export class UpdatePostDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(1) content?: string;
  @IsOptional() @IsInt() @Min(1) authorId?: number;
}
export class ListPostsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 10;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) authorId?: number;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
}
