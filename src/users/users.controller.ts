import { Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto';
@Controller('users')
export class UsersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}
  @Get() list() { return this.users.find({ order: { id: 'ASC' } }); }
  @Get(':id') async get(@Param('id', ParseIntPipe) id: number) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  private async save(user: User) {
    try { return await this.users.save(user); }
    catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Email already exists');
      throw error;
    }
  }
  @Post() create(@Body() dto: CreateUserDto) { return this.save(this.users.create(dto)); }
  @Patch(':id') async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.save(Object.assign(await this.get(id), dto));
  }
  @Delete(':id') @HttpCode(204) async remove(@Param('id', ParseIntPipe) id: number) {
    if (!(await this.users.delete(id)).affected) throw new NotFoundException('User not found');
  }
}
