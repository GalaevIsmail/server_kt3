import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
export class CreateSellerDto {
  @ApiProperty({ example: 'Магазин', maxLength: 120 })
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ example: 'shop@example.com', maxLength: 254 })
  @IsEmail() @MaxLength(254) email!: string;
}
export class UpdateSellerDto extends PartialType(CreateSellerDto, { skipNullProperties: false }) {}
export class ListSellersDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 10;
  @ApiPropertyOptional({ example: 'магазин' })
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional({ enum: ['id', 'name', 'email'], default: 'id' })
  @IsOptional() @IsIn(['id', 'name', 'email']) sortBy: 'id' | 'name' | 'email' = 'id';
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional() @IsIn(['ASC', 'DESC']) sortOrder: 'ASC' | 'DESC' = 'ASC';
}
