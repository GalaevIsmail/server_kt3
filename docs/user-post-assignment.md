# КТ 3 — PostgreSQL и TypeORM

Учебный REST API на NestJS. Пользователи (`User`) и публикации (`Post`) хранятся в PostgreSQL. Связь `User.posts` / `Post.author` — OneToMany / ManyToOne. При удалении пользователя его публикации удаляются каскадно. Уникальность email обеспечивает база данных.

## Запуск

Нужны Node.js 22+ и Docker с Compose. Порт 5432 должен быть свободен.

```bash
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run migration:run
npm run build
npm start
```

Для разработки: `npm run start:dev`. Конфигурация читается из `.env` или переменных процесса (`DATABASE_URL`, `PORT`). Пароль в Compose предназначен для локальной учебной БД. Для внешней БД задайте собственный `DATABASE_URL`. Данные Docker сохраняются в именованном томе. Остановка БД: `docker compose down` (без удаления тома).

## API

| Метод | Путь | Действие |
|---|---|---|
| POST | `/users` | Создать пользователя: `name`, `email` |
| GET | `/users` | Получить пользователей |
| GET | `/users/:id` | Получить пользователя |
| PATCH | `/users/:id` | Изменить `name` и/или `email` |
| DELETE | `/users/:id` | Удалить пользователя и его публикации |
| POST | `/posts` | Создать публикацию: `title`, `content`, `authorId` |
| GET | `/posts` | Список с авторами, фильтрацией и пагинацией |
| GET | `/posts/:id` | Публикация с автором |
| PATCH | `/posts/:id` | Изменить `title`, `content` и/или `authorId` |
| DELETE | `/posts/:id` | Удалить публикацию |

Пример (ID автора подставьте из первого ответа):

```bash
curl -X POST http://localhost:3000/users -H 'Content-Type: application/json' \
  -d '{"name":"Иван","email":"ivan@example.com"}'
curl -X POST http://localhost:3000/posts -H 'Content-Type: application/json' \
  -d '{"title":"PostgreSQL","content":"Первая публикация","authorId":1}'
curl 'http://localhost:3000/posts?authorId=1&search=postgres&page=1&limit=10'
```

Ответ списка: `{ "data": [...], "total": 1, "page": 1, "limit": 10, "totalPages": 1 }`. Поле `author` включено в каждую публикацию. `search` ищет подстроку в заголовке без учёта регистра; `%` и `_` имеют стандартное значение шаблонов SQL LIKE. Значения передаются параметрами, без конкатенации SQL. Сортировка — по ID публикации по убыванию. `page >= 1`, `1 <= limit <= 100`; по умолчанию страница 1, лимит 10.

Некорректные DTO возвращают 400, отсутствующий объект/автор — 404, повторный email — 409. Успешное удаление возвращает 204.

## Миграции и внешний ключ

`synchronize: false` явно задан в `src/database/data-source.ts`. Автоматическая синхронизация и автоматический запуск миграций отключены. Начальная миграция сгенерирована командой `migration:generate` и находится в `src/database/migrations/`.

После изменения сущностей в ходе разработки:

```bash
npm run migration:generate -- src/database/migrations/DescribeChange
# Проверьте SQL новой миграции перед применением.
npm run migration:run
# Откат последней миграции (удаляет данные при откате начальной схемы):
# npm run migration:revert
```

Проверка настоящей структуры PostgreSQL:

```bash
docker compose exec -T db psql -U postgres -d kt3 -c '\d posts'
```

В `Foreign-key constraints` виден внешний ключ `posts.authorId → users.id` с `ON DELETE CASCADE`. Он создан миграцией, а не только описан в TypeScript.

## QueryBuilder и N+1

Реальный обработчик `GET /posts` находится в `src/posts/posts.controller.ts`: `leftJoinAndSelect`, `where`/`andWhere`, `orderBy`, `skip`/`take`, `getManyAndCount`. Фильтры автора и заголовка применяются совместно, `total` учитывает фильтры до пагинации.

Код «до» и «после» с исполняемой проверкой — `src/database/n-plus-one-demo.ts`:

```ts
// До: 1 запрос публикаций + N отдельных запросов авторов.
const before = await posts.findBy({ authorId: author.id });
for (const post of before)
  post.author = await users.findOneByOrFail({ id: post.authorId });

// После: один SELECT с JOIN для всех публикаций и их авторов.
const after = await posts.createQueryBuilder('post')
  .leftJoinAndSelect('post.author', 'author')
  .where('post.authorId = :id', { id: author.id })
  .orderBy('post.id', 'ASC').getMany();
```

```bash
npm run demo:n-plus-one
```

Демонстрация создаёт три публикации внутри транзакции, считает реальные SELECT через логгер TypeORM, проверяет результат и откатывает тестовые данные: **до — 4 SELECT, после — 1 SELECT**. Не путать с пагинированным `getManyAndCount`: он может выполнять несколько запросов (выбор ID страницы, получение данных с JOIN и COUNT), но их количество не растёт на один запрос для каждого автора. Включить SQL-логи приложения: `DB_LOGGING=true npm start`.

## Проверки

При запущенных PostgreSQL и приложении:

```bash
npm run build
npm run test:e2e
npm run demo:n-plus-one
```

E2E-тест создаёт собственные записи и удаляет их после проверки. Он проверяет CRUD, смену автора, JOIN, оба фильтра, сортировку, две страницы результатов, валидацию, уникальность email и каскадное удаление. Можно переопределить адрес API через `API_URL`. Результаты выполненной проверки: [docs/validation.md](docs/validation.md).
