# Результаты проверки КТ 3

Проверено 17 октября 2026 года на Node.js 24.19.0 и PostgreSQL 16 (Docker). Все запросы выполнялись к реальной базе PostgreSQL.

| Проверка | Результат |
|---|---|
| `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` | Установка по lock-файлу успешна |
| `npm run build` | TypeScript компилируется без ошибок |
| `npm run migration:generate -- src/database/migrations/InitialSchema` | Начальная миграция сгенерирована из сущностей |
| `npm run migration:run` | Созданы users, posts, UNIQUE email, внешний ключ |
| Повторный `npm run migration:run` | No migrations are pending |
| `npm run typeorm -- schema:log -d src/database/data-source.ts` | Схема БД соответствует сущностям, изменений нет |
| `npm start` | NestJS успешно подключился к PostgreSQL и запустил API |
| `npm run test:e2e` | 6 passed, 0 failed, 0 skipped (основной тест и 5 вложенных проверок) |
| `npm run demo:n-plus-one` | N=3: before=4 SELECT, after=1 SELECT |

## Подтверждение внешнего ключа

Команда:

```bash
docker compose exec -T db psql -U postgres -d kt3 -c '\d posts'
```

Фактический вывод PostgreSQL:

```text
Foreign-key constraints:
    "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE CASCADE
```

## Соответствие критериям

1. Подключение к PostgreSQL через TypeORM, `synchronize: false`, схема управляется миграцией — `src/database/data-source.ts` и `src/database/migrations/`.
2. Связь OneToMany/ManyToOne и настоящий внешний ключ — `src/users/user.entity.ts`, `src/posts/post.entity.ts`, вывод psql выше.
3. QueryBuilder с JOIN, фильтрацией и сортировкой — `PostsController.list`.
4. Пагинация через skip/take с query-параметрами page/limit — `PostsController.list`, DTO и E2E-проверка двух страниц.
5. Дополнительное требование N+1 — исполняемый пример «до/после» в `src/database/n-plus-one-demo.ts` с проверкой количества реальных SQL-запросов.

Проверка npm ci выдала предупреждение об устаревшей транзитивной зависимости glob; установка и перечисленные проверки завершились успешно. Проверка безопасности зависимостей отдельной командой npm audit не проводилась.
