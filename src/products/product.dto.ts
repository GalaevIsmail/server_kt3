import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
export class CreateProductDto {
  @ApiProperty({ example: 'Ноутбук', maxLength: 200 })
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @ApiProperty({ example: 'Описание товара' })
  @IsString() @MinLength(1) description!: string;
  @ApiProperty({ example: 1999.99, minimum: 0, maximum: 9999999999.99 })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999.99) price!: number;
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt() @Min(1) @Max(2147483647) sellerId!: number;
}
export class UpdateProductDto extends PartialType(CreateProductDto, { skipNullProperties: false }) {}
