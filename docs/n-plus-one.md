# Устранение N+1 для продавцов и товаров

## До: 1 + N запросов

```ts
const sellers = await sellerRepository.find(); // один SELECT
for (const seller of sellers) {
  seller.products = await productRepository.findBy({ sellerId: seller.id });
  // ещё один SELECT на каждого продавца
}
```

Для 3 продавцов получается 4 SELECT, для 100 — 101. Даже продавец без товаров вызывает отдельный запрос.

## После: один запрос с LEFT JOIN

```ts
const sellers = await sellerRepository.createQueryBuilder('seller')
  .leftJoinAndSelect('seller.products', 'product')
  .orderBy('seller.id', 'ASC')
  .getMany();
```

Товары загружаются тем же SELECT. TypeORM объединяет строки JOIN в объекты продавцов с массивом products. LEFT JOIN сохраняет продавцов без товаров.

Исполняемая демонстрация с обоими вариантами: `src/database/sellers-n-plus-one-demo.ts`. Команда `npm run demo:n-plus-one` создаёт 3 продавцов с товарами в транзакции, измеряет SELECT через Logger TypeORM, проверяет 4 запроса до и 1 после и откатывает записи.

Фактический результат:

```text
Sellers N=3: before=4 SELECT, after=1 SELECT
```

В реальном GET /sellers используется тот же JOIN с фильтром и пагинацией. Пагинированный `getManyAndCount` может выполнять до трёх SELECT (ID страницы, данные с JOIN, COUNT). Это ограниченное число запросов, которое не растёт на один запрос для каждого продавца. Обычный JOIN без пагинации в примере выше выполняет один SELECT.
