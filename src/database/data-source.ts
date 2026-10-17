import 'reflect-metadata';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseOptions as makeOptions } from './options';
export const databaseOptions = makeOptions(new ConfigService()) as DataSourceOptions;
export default new DataSource(databaseOptions);
