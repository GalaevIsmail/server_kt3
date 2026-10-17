import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { CreateSellerDto, UpdateSellerDto, ListSellersDto } from './seller.dto';
@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly service: SellersService) {}
  @Get() @ApiOperation({ summary: 'Список sellers' })
  list(@Query() query: ListSellersDto) { return this.service.list(query); }
  @Get(':id') @ApiOperation({ summary: 'Получить seller по ID' })
  get(@Param('id', ParseIntPipe) id: number) { return this.service.get(id); }
  @Post() @ApiOperation({ summary: 'Создать seller' })
  create(@Body() dto: CreateSellerDto) { return this.service.create(dto); }
  @Patch(':id') @ApiOperation({ summary: 'Обновить seller' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSellerDto) { return this.service.update(id, dto); }
  @Delete(':id') @HttpCode(204) @ApiOperation({ summary: 'Удалить seller' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
