import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}
  @Get() @ApiOperation({ summary: 'Список products' })
  list() { return this.service.list(); }
  @Get(':id') @ApiOperation({ summary: 'Получить product по ID' })
  get(@Param('id', ParseIntPipe) id: number) { return this.service.get(id); }
  @Post() @ApiOperation({ summary: 'Создать product' })
  create(@Body() dto: CreateProductDto) { return this.service.create(dto); }
  @Patch(':id') @ApiOperation({ summary: 'Обновить product' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) { return this.service.update(id, dto); }
  @Delete(':id') @HttpCode(204) @ApiOperation({ summary: 'Удалить product' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
