# API продавцов и товаров — практическая работа

NestJS 11 + PostgreSQL 16 + TypeORM. Полный CRUD продавцов и товаров, миграции, DTO с валидацией и Swagger, оптимизированный список продавцов. Требуется **Node.js 24** и **Docker Engine с Compose**.

## Запуск

Из каталога проекта:

```bash
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run migration:run
npm run start:dev
```

Swagger UI доступен по пути **`/api`** на порту `PORT` (по умолчанию 3000). OpenAPI JSON — `/api-json`. Для каждого метода в Swagger можно выбрать **Try it out**, заполнить тело/параметры и выполнить запрос. Сначала создайте продавца, затем товар с его `sellerId`.

Для запуска скомпилированного приложения:

```bash
npm run build
npm start
```

Не запускайте оба режима на одном порту одновременно. На облачной машине с ограничением записи в домашний каталог используйте `npm ci --cache /workspace/.npm-cache`.

## Настройки

`.env` исключён из Git. Все основные параметры перечислены в `.env.example`:

| Переменная | Значение по умолчанию |
|---|---|
| PORT | 3000 |
| DB_HOST | localhost |
| DB_PORT | 5432 |
| DB_USERNAME | postgres |
| DB_PASSWORD | postgres |
| DB_DATABASE | kt3 |

Это локальные учебные параметры. `ConfigModule` и `ConfigService` читают их для приложения и CLI TypeORM. Дополнительно поддержан прежний `DATABASE_URL`; для обычного запуска оставьте его незаданным. `DB_LOGGING=true` включает SQL-логи.

Compose использует те же DB-параметры для первоначального создания БД. При изменении пользователя, пароля или имени базы в уже заполненном томе измените конфигурацию самой PostgreSQL: переменные инициализации не меняют существующую базу. Остановка: `docker compose down`; данные сохраняются в именованном томе. Флаг `-v` удаляет данные — для обычной остановки он не нужен.

## Сущности

- **Seller:** `id`, `name`, уникальный `email`, `products`.
- **Product:** `id`, `title`, `description`, `price`, `createdAt`, `sellerId`, `seller`.
- `Seller.products` — OneToMany, `Product.seller` — ManyToOne.
- Реальная колонка связи — **`products.seller_id → sellers.id`**, `ON DELETE CASCADE`.
- Цена хранится как `numeric(12,2)`; DTO разрешает значения от 0 до 9999999999.99 с максимум двумя знаками после запятой. В JSON цена возвращается числом.
- `createdAt` задаётся базой автоматически и не принимается в create/update DTO.

## API

| Метод | Маршрут | Назначение |
|---|---|---|
| POST | `/sellers` | Создать продавца (`name`, `email`) |
| GET | `/sellers` | Продавцы с товарами, фильтрацией, сортировкой и пагинацией |
| GET | `/sellers/:id` | Продавец с товарами |
| PATCH | `/sellers/:id` | Частично обновить продавца |
| DELETE | `/sellers/:id` | Удалить продавца и его товары |
| POST | `/products` | Создать товар (`title`, `description`, `price`, `sellerId`) |
| GET | `/products` | Список товаров с продавцами |
| GET | `/products/:id` | Товар с продавцом |
| PATCH | `/products/:id` | Частично обновить товар, включая смену продавца |
| DELETE | `/products/:id` | Удалить товар |

Ошибки DTO и лишние поля — 400; отсутствующий продавец/товар — 404; повторяющийся email — 409. При создании и изменении товара существование продавца проверяется; внешний ключ дополнительно защищает связь в БД. Успешное создание возвращает 201, удаление — 204.

Пример:

```bash
curl -X POST http://localhost:3000/sellers -H 'Content-Type: application/json' \
  -d '{"name":"Магазин электроники","email":"shop@example.com"}'
# Подставьте фактический ID из ответа вместо 1:
curl -X POST http://localhost:3000/products -H 'Content-Type: application/json' \
  -d '{"title":"Ноутбук","description":"Учебный пример","price":59990.50,"sellerId":1}'
curl 'http://localhost:3000/sellers?name=магазин&page=1&limit=10&sortBy=name&sortOrder=ASC'
```

### GET /sellers

| Параметр | По умолчанию | Ограничения |
|---|---|---|
| page | 1 | Целое число >= 1 |
| limit | 10 | Целое число 1–100 |
| name | — | Необязательный фильтр ILIKE по имени |
| sortBy | id | id, name, email |
| sortOrder | ASC | ASC, DESC |

```json
{
  "data": [
    {
      "id": 1,
      "name": "Магазин электроники",
      "email": "shop@example.com",
      "products": []
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

`SellersService.list` использует `leftJoinAndSelect('seller.products', 'product')`, `where`/`andWhere`, `orderBy`, `skip`/`take`. Пагинация применяется к продавцам, товары каждого продавца возвращаются целиком; продавцы без товаров также включаются. Фильтр передаётся SQL-параметром; `%` и `_` сохраняют значение шаблонов LIKE. Поле сортировки ограничено списком DTO. При совпадающих именах/email дополнительная сортировка по ID обеспечивает стабильный порядок.

## Миграции и подтверждение FK

`synchronize: false`, `autoLoadEntities: true`. Миграции запускаются явно. Конфигурация приложения — `src/database/options.ts`, отдельный CLI DataSource — `src/database/data-source.ts`.

```bash
# Создать миграцию после изменений entity:
npm run migration:generate -- src/database/migrations/DescribeChange
# Проверить SQL, затем применить:
npm run migration:run
# Откат последней миграции (может удалить таблицы и данные):
# npm run migration:revert
# Проверить соответствие схемы сущностям без изменения БД:
npm run typeorm -- schema:log -d src/database/data-source.ts
# Подтвердить настоящий внешний ключ:
docker compose exec -T db psql -U postgres -d kt3 -c '\d products'
```

Если меняли DB_USERNAME/DB_DATABASE, подставьте их в команду psql. Фактический вывод и результаты проверки приведены в [docs/sellers-validation.md](docs/sellers-validation.md).

## N+1: до и после

Исполняемый пример: **`src/database/sellers-n-plus-one-demo.ts`**, объяснение: [docs/n-plus-one.md](docs/n-plus-one.md).

```bash
npm run demo:n-plus-one
```

Для трёх продавцов: **до — 4 SELECT (1 + N), после — 1 SELECT с LEFT JOIN**. Демонстрация считает реальные запросы логгером TypeORM, проверяет результат и откатывает тестовые данные.

## Самопроверка

При работающих приложении и БД:

```bash
npm run test:e2e
npm run demo:n-plus-one
```

Тесты проверяют Swagger UI/OpenAPI, все CRUD-маршруты продавцов и товаров, DTO, уникальный email, смену продавца, JOIN, ILIKE, ASC/DESC, пагинацию и каскадное удаление. Созданные тестовые записи очищаются. `API_URL` позволяет изменить адрес тестируемого API.

Для ручной проверки в Swagger: POST seller → POST нескольких products → GET sellers с фильтром и страницей → PATCH product с другим sellerId → DELETE seller → GET удалённого товара (404). Все маршруты `/sellers` и `/products` описаны в Swagger.

## Структура и сдача

- `src/sellers/`, `src/products/` — модули, контроллеры, сервисы, DTO, entity.
- `src/database/migrations/*AddSellersProducts.ts` — сгенерированная миграция продавцов и товаров.
- `test/sellers.test.js` — интеграционная проверка нового задания на настоящей PostgreSQL.
- `docs/sellers-validation.md` — подтверждение FK и выполненных проверок.

Предыдущее задание User/Post сохранено в отдельных модулях и начальной миграции; его описание — `docs/user-post-assignment.md`. Оно не используется для реализации Seller/Product.

Для сдачи подходит весь исходный проект с package-lock.json, README, .env.example и миграциями; не включайте `.env`, node_modules и dist. Архив проекта подготовлен отдельно. Изменения в GitHub автоматически не отправлялись.
