import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';
export function databaseOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get('DB_PORT', 5432)),
    username: config.get<string>('DB_USERNAME', 'postgres'),
    password: config.get<string>('DB_PASSWORD', 'postgres'),
    database: config.get<string>('DB_DATABASE', 'kt3'),
    // Preserve DATABASE_URL support for the earlier User/Post assignment.
    ...(config.get<string>('DATABASE_URL') ? { url: config.get<string>('DATABASE_URL') } : {}),
    entities: [Seller, Product, User, Post],
    autoLoadEntities: true,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: config.get('DB_LOGGING') === 'true',
  };
}
