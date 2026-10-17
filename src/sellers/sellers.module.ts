import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
@Module({ imports: [TypeOrmModule.forFeature([Seller, Product])], controllers: [SellersController], providers: [SellersService] })
export class SellersModule {}
