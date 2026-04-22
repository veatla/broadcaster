# Posts — Feature Specification

## Сущности

### Post

Основная единица контента. Создаётся пользователем.

| Поле          | Тип               | Обязательно | Описание                               |
| ------------- | ----------------- | ----------- | -------------------------------------- |
| `id`          | uuid              | —           | Первичный ключ                         |
| `author_id`   | uuid → users      | ✓           | Автор поста                            |
| `category_id` | uuid → categories | ✓           | Категория (pony, furry, human, etc.)   |
| `title`       | text              | ✓           | Заголовок                              |
| `subtitle`    | text              | —           | Подзаголовок                           |
| `description` | text              | —           | Описание / artist comment              |
| `views_count` | integer           | —           | Счётчик просмотров (денормализованный) |
| `short_code`  | text              | ✓ unique    | Код для короткой ссылки (`/p/xK3q`)    |
| `created_at`  | timestamp         | ✓           | —                                      |
| `updated_at`  | timestamp         | —           | —                                      |

---

### Category

Предопределённый список. Пользователь выбирает **одну** категорию на пост.

```
pony, furry, human, anthro, creature, other, ...
```

| Поле    | Тип         | Описание                   |
| ------- | ----------- | -------------------------- |
| `id`    | uuid        | —                          |
| `slug`  | text unique | URL-safe имя (`furry`)     |
| `label` | text        | Отображаемое имя (`Furry`) |

---

### Tag

Теги свободной формы, опциональны.

| Поле   | Тип         | Описание                            |
| ------ | ----------- | ----------------------------------- |
| `id`   | uuid        | —                                   |
| `name` | text unique | Нормализованное имя (`digital art`) |

**Связь:** `post_tags(post_id, tag_id)` — многие ко многим.

---

### Attachment

Один пост = **одно** изображение. Переиспользует существующую таблицу `attachments`, где уже есть `post_id`. Нужно добавить:

| Поле               | Тип  | Описание                       |
| ------------------ | ---- | ------------------------------ |
| `url`              | text | Путь к файлу в хранилище       |
| `mime_type`        | text | `image/png`, `image/gif`, etc. |
| `width` / `height` | integer | Для правильного рендера превью |

> Один пост может иметь только одну запись в `attachments`. Уникальность обеспечивается через `UNIQUE(post_id)` в таблице `attachments`.

---

### PostLike

| Поле         | Тип          |
| ------------ | ------------ |
| `post_id`    | uuid → posts |
| `user_id`    | uuid → users |
| `created_at` | timestamp    |

PK: `(post_id, user_id)`.

---

### Comment

Комментарии с поддержкой тредов (Reddit-стиль).

| Поле         | Тип             | Описание                       |
| ------------ | --------------- | ------------------------------ |
| `id`         | uuid            | —                              |
| `post_id`    | uuid → posts    | К какому посту                 |
| `author_id`  | uuid → users    | Автор                          |
| `parent_id`  | uuid → comments | `NULL` = корневой, иначе reply |
| `content`    | text            | Текст комментария              |
| `created_at` | timestamp       | —                              |
| `updated_at` | timestamp       | —                              |
| `deleted_at` | timestamp       | Soft delete (тред остаётся)    |

> **Глубина:** рекомендуется ограничить до 2–3 уровней вложенности на фронте, хотя схема не ограничивает.

---

### CommentLike

| Поле         | Тип             |
| ------------ | --------------- |
| `comment_id` | uuid → comments |
| `user_id`    | uuid → users    |
| `created_at` | timestamp       |

PK: `(comment_id, user_id)`.

---

### Collection

Пользователь создаёт именованные коллекции и добавляет в них посты.

| Таблица            | Поля                                                 |
| ------------------ | ---------------------------------------------------- |
| `collections`      | `id`, `owner_id`, `name`, `is_private`, `created_at` |
| `collection_posts` | `collection_id`, `post_id`, `added_at`               |

PK `collection_posts`: `(collection_id, post_id)`.

---

## Короткая ссылка

- При создании поста генерируется `short_code` (7 символов, base62).
- Ссылка вида: `https://devart.example/p/<short_code>`
- Резолвится в оригинальный URL поста + инкрементирует `views_count`.

---

## Счётчик просмотров

Денормализованный `views_count` на посте. При просмотре:

1. Инкремент через `UPDATE posts SET views_count = views_count + 1`.
2. Опционально — debounce/deduplicate по `(post_id, user_id/ip)` в Redis, чтобы не накручивался при перезагрузках.

---

## API — основные эндпоинты

```
POST   /posts                    — создать пост
GET    /posts/:id                — получить пост (+ инкремент просмотров)
PATCH  /posts/:id                — редактировать
DELETE /posts/:id                — удалить

POST   /posts/:id/like           — лайкнуть / убрать лайк (toggle)

GET    /posts/:id/comments       — список комментариев (дерево)
POST   /posts/:id/comments       — добавить комментарий
POST   /comments/:id/like        — лайк на комментарий (toggle)
DELETE /comments/:id             — удалить комментарий (soft)

POST   /collections              — создать коллекцию
POST   /collections/:id/posts    — добавить пост в коллекцию
DELETE /collections/:id/posts/:postId — убрать из коллекции

GET    /p/:short_code            — редирект по короткой ссылке
```

---

## Изменения в существующей схеме

В `attachments` уже есть `post_id` — нужно добавить `url`, `mime_type`, `width`, `height`. Также добавить `UNIQUE(post_id)` для ограничения одного изображения на пост.

Новые таблицы для добавления в `tables.ts`:
`categories`, `tags`, `post_tags`, `post_likes`, `comments`, `comment_likes`, `collections`, `collection_posts`.
