import assert from 'node:assert/strict';
import { DataSource, Logger } from 'typeorm';
import { databaseOptions } from './data-source';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';
let selects = 0;
const logger: Logger = {
  logQuery(sql) { if (/^SELECT/i.test(sql)) selects++; },
  logQueryError() {}, logQuerySlow() {}, logSchemaBuild() {}, logMigration() {}, log() {},
};
async function main() {
  const db = await new DataSource({ ...databaseOptions, logging: ['query'], logger }).initialize();
  const runner = db.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const sellers = runner.manager.getRepository(Seller);
    const products = runner.manager.getRepository(Product);
    const created = await sellers.save([1, 2, 3].map(i => sellers.create({ name: `Demo ${i}`, email: `demo-${Date.now()}-${i}@example.com` })));
    await products.save(created.map(s => products.create({ title: 'Demo', description: 'N+1', price: 10, sellerId: s.id })));
    const ids = created.map(s => s.id);
    selects = 0;
    // BEFORE: 1 SELECT for sellers + N SELECTs for their products.
    const before = await sellers.createQueryBuilder('seller').where('seller.id IN (:...ids)', { ids }).getMany();
    for (const seller of before) seller.products = await products.findBy({ sellerId: seller.id });
    const beforeCount = selects;
    selects = 0;
    // AFTER: 1 SELECT with LEFT JOIN, including sellers with no products.
    const after = await sellers.createQueryBuilder('seller')
      .leftJoinAndSelect('seller.products', 'product')
      .where('seller.id IN (:...ids)', { ids }).getMany();
    const afterCount = selects;
    assert.equal(before.length, 3);
    assert.equal(after.length, 3);
    assert.ok(after.every(s => s.products.length === 1));
    assert.equal(beforeCount, 4);
    assert.equal(afterCount, 1);
    console.log(`Sellers N=3: before=${beforeCount} SELECT, after=${afterCount} SELECT`);
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await db.destroy();
  }
}
main().catch(error => { console.error(error); process.exit(1); });
