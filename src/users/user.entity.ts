import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from '../posts/post.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 120 }) name!: string;
  @Column({ unique: true, length: 254 }) email!: string;
  @OneToMany(() => Post, post => post.author) posts!: Post[];
}
