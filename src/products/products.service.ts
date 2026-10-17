import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './product.dto';
@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private readonly products: Repository<Product>, @InjectRepository(Seller) private readonly sellers: Repository<Seller>) {}
  list() { return this.products.find({ relations: { seller: true }, order: { id: 'ASC' } }); }
  async get(id: number) {
    const product = await this.products.findOne({ where: { id }, relations: { seller: true } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
  private async checkSeller(id: number) {
    if (!await this.sellers.existsBy({ id })) throw new NotFoundException('Seller not found');
  }
  private async save(product: Product) {
    try { return await this.products.save(product); }
    catch (error) {
      // Also handles a seller deleted between the existence check and INSERT/UPDATE.
      if ((error as { code?: string }).code === '23503') throw new NotFoundException('Seller not found');
      throw error;
    }
  }
  async create(dto: CreateProductDto) {
    await this.checkSeller(dto.sellerId);
    return this.save(this.products.create(dto));
  }
  async update(id: number, dto: UpdateProductDto) {
    const { seller, ...product } = await this.get(id);
    if (dto.sellerId !== undefined) await this.checkSeller(dto.sellerId);
    return this.save(this.products.create({ ...product, ...dto }));
  }
  async remove(id: number) {
    if (!(await this.products.delete(id)).affected) throw new NotFoundException('Product not found');
  }
}
