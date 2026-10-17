import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/options';
import { User } from './users/user.entity';
import { Post } from './posts/post.entity';
import { UsersController } from './users/users.controller';
import { PostsController } from './posts/posts.controller';
import { SellersModule } from './sellers/sellers.module';
import { ProductsModule } from './products/products.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: databaseOptions }),
    TypeOrmModule.forFeature([User, Post]),
    SellersModule,
    ProductsModule,
  ],
  controllers: [AppController, UsersController, PostsController],
})
export class AppModule {}
