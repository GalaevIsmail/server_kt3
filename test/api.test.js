const { test } = require('node:test');
const assert = require('node:assert/strict');
const base = process.env.API_URL || 'http://127.0.0.1:3000';
async function request(path, method = 'GET', body, status = 200) {
  const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  assert.equal(response.status, status, text);
  return text ? JSON.parse(text) : undefined;
}
test('CRUD, PostgreSQL relations, filtering and pagination', async t => {
  const stamp = `${Date.now()}-${process.pid}`;
  let first, second;
  try {
    first = await request('/users', 'POST', { name: 'First', email: `first-${stamp}@example.com` }, 201);
    second = await request('/users', 'POST', { name: 'Second', email: `second-${stamp}@example.com` }, 201);
    const created = [];
    await t.test('create and read linked posts', async () => {
      for (let i = 0; i < 3; i++) created.push(await request('/posts', 'POST', { title: `KT3-${stamp}-${i}`, content: 'PostgreSQL content', authorId: first.id }, 201));
      const post = await request(`/posts/${created[0].id}`);
      assert.equal(post.author.id, first.id);
      assert.equal(post.content, 'PostgreSQL content');
    });
    await t.test('join, filters, descending order and two pages', async () => {
      const url = `/posts?authorId=${first.id}&search=kt3-${stamp}&limit=2`;
      const page1 = await request(url + '&page=1');
      const page2 = await request(url + '&page=2');
      assert.equal(page1.total, 3);
      assert.equal(page1.totalPages, 2);
      assert.deepEqual(page1.data.map(p => p.id), [created[2].id, created[1].id]);
      assert.deepEqual(page2.data.map(p => p.id), [created[0].id]);
      assert.ok(page1.data.every(p => p.author.email === first.email));
      assert.equal((await request(`/posts?authorId=${second.id}&search=KT3-${stamp}`)).total, 0);
    });
    await t.test('update user and change post author', async () => {
      assert.equal((await request(`/users/${first.id}`, 'PATCH', { name: 'Updated' })).name, 'Updated');
      await request(`/posts/${created[0].id}`, 'PATCH', { title: 'Changed', authorId: second.id });
      const post = await request(`/posts/${created[0].id}`);
      assert.equal(post.title, 'Changed');
      assert.equal(post.author.id, second.id);
    });
    await t.test('validation, missing author and duplicate email', async () => {
      await request('/posts?page=0', 'GET', undefined, 400);
      await request('/posts?limit=101', 'GET', undefined, 400);
      await request('/posts?authorId=abc', 'GET', undefined, 400);
      await request('/users', 'POST', { name: 'Bad', email: 'invalid' }, 400);
      await request('/users', 'POST', { name: 'Duplicate', email: first.email }, 409);
      await request('/posts', 'POST', { title: 'X', content: 'Y', authorId: 2147483647 }, 404);
    });
    await t.test('delete post and cascade delete user posts', async () => {
      await request(`/posts/${created[0].id}`, 'DELETE', undefined, 204);
      await request(`/posts/${created[0].id}`, 'GET', undefined, 404);
      await request(`/users/${first.id}`, 'DELETE', undefined, 204);
      await request(`/posts/${created[1].id}`, 'GET', undefined, 404);
      await request(`/users/${first.id}`, 'GET', undefined, 404);
    });
  } finally {
    for (const user of [first, second]) if (user) {
      const response = await fetch(`${base}/users/${user.id}`, { method: 'DELETE' });
      assert.ok([204, 404].includes(response.status));
    }
  }
});
