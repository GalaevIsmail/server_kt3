const { test } = require('node:test');
const assert = require('node:assert/strict');
const base = process.env.API_URL || 'http://127.0.0.1:3000';
async function req(path, method = 'GET', body, status = 200) {
  const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  assert.equal(r.status, status, `${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : undefined;
}
test('Seller/Product assignment: real PostgreSQL API', async t => {
  const token = `kt3-${Date.now()}-${process.pid}`;
  const sellers = [], products = [];
  try {
    await t.test('Swagger UI and documented CRUD operations and DTOs', async () => {
      const root = await fetch(base + '/', { redirect: 'manual' });
      assert.equal(root.status, 302);
      assert.equal(root.headers.get('location'), '/api');
      const ui = await fetch(base + '/api');
      assert.equal(ui.status, 200);
      assert.match(await ui.text(), /swagger-ui/);
      const spec = await req('/api-json');
      for (const resource of ['sellers', 'products']) {
        for (const method of ['get', 'post']) assert.ok(spec.paths[`/${resource}`][method]);
        for (const method of ['get', 'patch', 'delete']) assert.ok(spec.paths[`/${resource}/{id}`][method]);
      }
      assert.ok(spec.components.schemas.CreateProductDto.properties.price);
      assert.ok(spec.paths['/sellers'].get.parameters.some(p => p.name === 'sortBy'));
    });
    await t.test('create sellers and products, retrieve both resources', async () => {
      for (const name of ['B', 'A', 'C']) sellers.push(await req('/sellers', 'POST', { name: `${token}-${name}`, email: `${token}-${name}@example.com` }, 201));
      for (let i = 0; i < 3; i++) products.push(await req('/products', 'POST', { title: `Product ${i}`, description: 'Описание', price: 12.34, sellerId: sellers[0].id }, 201));
      assert.equal((await req(`/sellers/${sellers[0].id}`)).products.length, 3);
      const product = await req(`/products/${products[0].id}`);
      assert.equal(product.seller.id, sellers[0].id);
      assert.equal(product.price, 12.34);
      assert.ok(Number.isFinite(Date.parse(product.createdAt)));
      assert.ok((await req('/products')).some(p => p.id === product.id));
    });
    await t.test('JOIN with complete products, filter, sort and seller pagination', async () => {
      const url = `/sellers?name=${token.toUpperCase()}&sortBy=name&sortOrder=ASC&limit=2`;
      const first = await req(url + '&page=1');
      const second = await req(url + '&page=2');
      assert.deepEqual(first.meta, { page: 1, limit: 2, total: 3, totalPages: 2 });
      assert.deepEqual(first.data.map(s => s.id), [sellers[1].id, sellers[0].id]);
      assert.equal(first.data[0].products.length, 0);
      assert.equal(first.data[1].products.length, 3);
      assert.deepEqual(second.data.map(s => s.id), [sellers[2].id]);
      const descending = await req(`/sellers?name=${token}&sortBy=email&sortOrder=DESC`);
      assert.deepEqual(descending.data.map(s => s.id), [sellers[2].id, sellers[0].id, sellers[1].id]);
      assert.equal((await req(`/sellers?name=${token}&page=99`)).data.length, 0);
    });
    await t.test('PATCH seller/product and move product to another seller', async () => {
      assert.equal((await req(`/sellers/${sellers[0].id}`, 'PATCH', { name: `${token}-Updated` })).name, `${token}-Updated`);
      await req(`/products/${products[0].id}`, 'PATCH', { title: 'Changed', description: 'Updated', price: 0, sellerId: sellers[1].id });
      const product = await req(`/products/${products[0].id}`);
      assert.equal(product.title, 'Changed');
      assert.equal(product.price, 0);
      assert.equal(product.seller.id, sellers[1].id);
      assert.equal((await req(`/sellers/${sellers[0].id}`)).products.length, 2);
    });
    await t.test('validation and 404/409 business errors', async () => {
      for (const query of ['page=0', 'limit=101', 'page=1.5', 'sortBy=password', 'sortOrder=DROP']) await req(`/sellers?${query}`, 'GET', undefined, 400);
      await req('/sellers', 'POST', { name: 'Invalid', email: 'invalid' }, 400);
      await req('/sellers', 'POST', { name: 'Duplicate', email: sellers[0].email }, 409);
      await req(`/sellers/${sellers[1].id}`, 'PATCH', { email: sellers[0].email }, 409);
      await req(`/sellers/${sellers[0].id}`, 'PATCH', { name: null }, 400);
      await req('/products', 'POST', { title: 'X', description: 'Y', price: -1, sellerId: sellers[0].id }, 400);
      await req('/products', 'POST', { title: 'X', description: 'Y', price: 1.001, sellerId: sellers[0].id }, 400);
      await req('/products', 'POST', { title: 'X', description: 'Y', price: 1, sellerId: 2147483647 }, 404);
      await req(`/products/${products[0].id}`, 'PATCH', { sellerId: 2147483647 }, 404);
      await req(`/products/${products[0].id}`, 'PATCH', { price: null }, 400);
      await req(`/products/${products[0].id}`, 'PATCH', { createdAt: '2020-01-01' }, 400);
      await req('/sellers/2147483647', 'GET', undefined, 404);
      await req('/products/not-an-id', 'GET', undefined, 400);
    });
    await t.test('delete product and seller cascade enforced by PostgreSQL', async () => {
      await req(`/products/${products[0].id}`, 'DELETE', undefined, 204);
      await req(`/products/${products[0].id}`, 'GET', undefined, 404);
      await req(`/sellers/${sellers[0].id}`, 'DELETE', undefined, 204);
      await req(`/sellers/${sellers[0].id}`, 'GET', undefined, 404);
      await req(`/products/${products[1].id}`, 'GET', undefined, 404);
      await req(`/products/${products[2].id}`, 'GET', undefined, 404);
    });
  } finally {
    for (const seller of sellers) {
      const r = await fetch(`${base}/sellers/${seller.id}`, { method: 'DELETE' });
      assert.ok([204, 404].includes(r.status));
    }
  }
});
