import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 200 }) title!: string;
  @Column('text') description!: string;
  @Column('numeric', { precision: 12, scale: 2, transformer: { to: (value: number) => value, from: (value: string) => Number(value) } }) price!: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @Index() @Column({ name: 'seller_id' }) sellerId!: number;
  @ManyToOne(() => Seller, seller => seller.products, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' }) seller!: Seller;
}
