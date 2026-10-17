import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Patch, Post as HttpPost, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { CreatePostDto, ListPostsDto, UpdatePostDto } from '../dto';
@Controller('posts')
export class PostsController {
  constructor(@InjectRepository(Post) private readonly posts: Repository<Post>, @InjectRepository(User) private readonly users: Repository<User>) {}
  @Get() async list(@Query() query: ListPostsDto) {
    const qb = this.posts.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('1 = 1');
    if (query.authorId !== undefined) qb.andWhere('post.authorId = :authorId', { authorId: query.authorId });
    if (query.search) qb.andWhere('post.title ILIKE :search', { search: `%${query.search}%` });
    const [data, total] = await qb.orderBy('post.id', 'DESC')
      .skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }
  @Get(':id') async get(@Param('id', ParseIntPipe) id: number) {
    const post = await this.posts.findOne({ where: { id }, relations: { author: true } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
  private async checkAuthor(authorId: number) {
    if (!await this.users.existsBy({ id: authorId })) throw new NotFoundException('Author not found');
  }
  @HttpPost() async create(@Body() dto: CreatePostDto) {
    await this.checkAuthor(dto.authorId);
    return this.posts.save(this.posts.create(dto));
  }
  @Patch(':id') async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    const post = await this.get(id);
    if (dto.authorId !== undefined) await this.checkAuthor(dto.authorId);
    // Remove the loaded relation so changing authorId cannot be overridden by it.
    const { author, ...fields } = post;
    return this.posts.save(this.posts.create({ ...fields, ...dto }));
  }
  @Delete(':id') @HttpCode(204) async remove(@Param('id', ParseIntPipe) id: number) {
    if (!(await this.posts.delete(id)).affected) throw new NotFoundException('Post not found');
  }
}
