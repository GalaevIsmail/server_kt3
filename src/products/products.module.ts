import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
@Module({ imports: [TypeOrmModule.forFeature([Seller, Product])], controllers: [ProductsController], providers: [ProductsService] })
export class ProductsModule {}
