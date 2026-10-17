import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 200 }) title!: string;
  @Column('text') content!: string;
  @Column() authorId!: number;
  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'authorId' }) author!: User;
}
