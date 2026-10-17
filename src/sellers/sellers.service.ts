import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './seller.entity';
import { CreateSellerDto, ListSellersDto, UpdateSellerDto } from './seller.dto';
@Injectable()
export class SellersService {
  constructor(@InjectRepository(Seller) private readonly sellers: Repository<Seller>) {}
  async list(query: ListSellersDto) {
    const qb = this.sellers.createQueryBuilder('seller')
      .leftJoinAndSelect('seller.products', 'product').where('1 = 1');
    if (query.name) qb.andWhere('seller.name ILIKE :name', { name: `%${query.name}%` });
    qb.orderBy(`seller.${query.sortBy}`, query.sortOrder);
    if (query.sortBy !== 'id') qb.addOrderBy('seller.id', 'ASC');
    const [data, total] = await qb.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }
  async get(id: number) {
    const seller = await this.sellers.findOne({ where: { id }, relations: { products: true } });
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }
  private async save(seller: Seller) {
    try { return await this.sellers.save(seller); }
    catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Email already exists');
      throw error;
    }
  }
  create(dto: CreateSellerDto) { return this.save(this.sellers.create(dto)); }
  async update(id: number, dto: UpdateSellerDto) {
    const { products, ...seller } = await this.get(id);
    return this.save(this.sellers.create({ ...seller, ...dto }));
  }
  async remove(id: number) {
    if (!(await this.sellers.delete(id)).affected) throw new NotFoundException('Seller not found');
  }
}
