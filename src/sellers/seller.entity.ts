import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../products/product.entity';
@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 120 }) name!: string;
  @Column({ unique: true, length: 254 }) email!: string;
  @OneToMany(() => Product, product => product.seller) products!: Product[];
}
