# Проверка задания Seller / Product

Проверено 17 октября 2026 года на Node.js 24.19.0 и PostgreSQL 16 в Docker. Проверки выполнялись на настоящей PostgreSQL.

| Проверка | Результат |
|---|---|
| npm ci по package-lock.json | Успешно |
| npm run build | TypeScript компилируется |
| migration:generate AddSellersProducts | Сгенерирована миграция сущностей, индекса seller_id и FK |
| migration:run на основной БД | Миграция применена |
| Все миграции на отдельной пустой БД | Успешно |
| migration:revert, затем migration:run на отдельной проверочной БД | Откат и повторное применение Seller/Product успешны |
| schema:log | Схема соответствует entity, нет SQL для синхронизации |
| npm start | Приложение запущено и подключено к БД |
| /api и /api-json | Swagger UI и OpenAPI доступны; описаны все 10 CRUD-операций Seller/Product |
| npm run test:e2e | 13 passed, 0 failed, 0 skipped |
| npm run demo:n-plus-one | Sellers N=3: before=4 SELECT, after=1 SELECT |

13 проверок включают 2 основных теста и 11 вложенных: для нового задания — основной тест с 6 вложенными проверками, для сохранённого User/Post — основной с 5 вложенными. Swagger проверен HTTP-запросами к UI/OpenAPI; CRUD проверен автоматическими HTTP-запросами. Ручное нажатие кнопок в браузере не выполнялось.

## Проверенные сценарии Seller/Product

- Создание, чтение списка и отдельной записи, обновление, удаление обеих сущностей.
- Связанные товары в GET seller и продавец в GET product.
- Decimal-цена, автоматически заполненный createdAt.
- ILIKE по имени; сортировка name ASC / email DESC.
- Две страницы продавцов; все товары продавца сохранены на странице; продавцы без товаров включены.
- Проверка формата `{ data, meta: { page, limit, total, totalPages } }`.
- Запрет некорректных page, limit, sortBy, sortOrder, email, price, null и лишних полей.
- 409 на повторный email при создании и обновлении.
- 404 при несуществующем sellerId при создании и обновлении товара.
- Перенос товара другому продавцу.
- Удаление продавца каскадно удаляет его товары; удалённые записи возвращают 404.

## Фактическая структура PostgreSQL

Команда:

```bash
docker compose exec -T db psql -U postgres -d kt3 -c '\d products'
```

Вывод:

```text
                                       Table "public.products"
   Column    |           Type           | Nullable |               Default
-------------+--------------------------+----------+--------------------------------------
 id          | integer                  | not null | nextval('products_id_seq'::regclass)
 title       | character varying(200)   | not null |
 description | text                     | not null |
 price       | numeric(12,2)            | not null |
 createdAt   | timestamp with time zone | not null | now()
 seller_id   | integer                  | not null |
Indexes:
    "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY, btree (id)
    "IDX_425ee27c69d6b8adc5d6475dcf" btree (seller_id)
Foreign-key constraints:
    "FK_425ee27c69d6b8adc5d6475dcfe" FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
```

Таким образом, связь подтверждена на уровне БД. `synchronize` выключен; таблицы, индекс и внешний ключ создаются миграцией `1792219739373-AddSellersProducts.ts`.

## N+1

Код до/после: `src/database/sellers-n-plus-one-demo.ts`; объяснение: `docs/n-plus-one.md`. Логгер измерил 4 SELECT до и 1 SELECT после для трёх продавцов. Тестовые записи создаются внутри откатываемой транзакции.
