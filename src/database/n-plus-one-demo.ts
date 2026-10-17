import assert from 'node:assert/strict';
import { DataSource, Logger } from 'typeorm';
import { databaseOptions } from './data-source';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
let selects = 0;
const logger: Logger = {
  logQuery(query) { if (/^SELECT/i.test(query)) selects++; },
  logQueryError() {}, logQuerySlow() {}, logSchemaBuild() {}, logMigration() {}, log() {},
};
async function main() {
  const db = await new DataSource({ ...databaseOptions, logging: ['query'], logger }).initialize();
  const runner = db.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const users = runner.manager.getRepository(User);
    const posts = runner.manager.getRepository(Post);
    const author = await users.save(users.create({ name: 'N+1 demo', email: `n1-${Date.now()}@example.com` }));
    await posts.save([1, 2, 3].map(i => posts.create({ title: `Example ${i}`, content: 'Demo', authorId: author.id })));
    selects = 0;
    // BEFORE: one SELECT for posts, then one SELECT per author: 1 + N.
    const before = await posts.findBy({ authorId: author.id });
    for (const post of before) post.author = await users.findOneByOrFail({ id: post.authorId });
    const beforeCount = selects;
    selects = 0;
    // AFTER: PostgreSQL joins all authors in one SELECT, independent of N.
    const after = await posts.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.authorId = :id', { id: author.id }).orderBy('post.id', 'ASC').getMany();
    const afterCount = selects;
    assert.equal(before.length, 3);
    assert.equal(after.length, 3);
    assert.ok(after.every(p => p.author.id === author.id));
    assert.equal(beforeCount, 4);
    assert.equal(afterCount, 1);
    console.log(`N=3: before=${beforeCount} SELECT, after=${afterCount} SELECT`);
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await db.destroy();
  }
}
main().catch(error => { console.error(error); process.exit(1); });
