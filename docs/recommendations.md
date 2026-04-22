# Recommendations — Feature Specification

## Концепция

Двухуровневая система без ML:

- **Новый / неавторизованный пользователь** → глобальный trending
- **Авторизованный с историей** → trending, отфильтрованный по category affinity

---

## Схема данных

### post_views

Нужна для двух целей: не показывать уже виденное + инкремент `views_count` на посте.

| Поле        | Тип          | Описание |
| ----------- | ------------ | -------- |
| `post_id`   | uuid → posts | —        |
| `user_id`   | uuid → users | —        |
| `viewed_at` | timestamp    | —        |

PK: `(post_id, user_id)`. При повторном просмотре — upsert по `viewed_at`.

---

### user_category_scores

Накопленный интерес пользователя к категориям.

| Поле          | Тип               | Описание         |
| ------------- | ----------------- | ---------------- |
| `user_id`     | uuid → users      | —                |
| `category_id` | uuid → categories | —                |
| `score`       | integer           | Накопленный счёт |
| `updated_at`  | timestamp         | —                |

PK: `(user_id, category_id)`.

---

### Денормализованные счётчики на posts

Для быстрой сортировки без тяжёлых JOIN:

```
posts.likes_count    integer  default 0
posts.views_count    integer  default 0
posts.comments_count integer  default 0
```

Инкрементируются при соответствующих событиях.

---

## Начисление очков

При каждом действии пользователя делается upsert в `user_category_scores`:

| Действие            | +score |
| ------------------- | ------ |
| Просмотрел пост     | +1     |
| Лайкнул             | +5     |
| Прокомментировал    | +3     |
| Добавил в коллекцию | +4     |

```sql
INSERT INTO user_category_scores (user_id, category_id, score, updated_at)
VALUES (:user_id, :category_id, :points, NOW())
ON CONFLICT (user_id, category_id)
DO UPDATE SET
  score = user_category_scores.score + EXCLUDED.score,
  updated_at = NOW();
```

---

## Запросы

### Trending (без персонализации)

```sql
SELECT p.*,
  (p.likes_count * 3 + p.views_count * 0.1 + p.comments_count * 2) AS score
FROM posts p
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY score DESC
LIMIT 20;
```

### Персональная лента

```sql
SELECT p.*,
  (p.likes_count * 3 + p.views_count * 0.1 + p.comments_count * 2) * ucs.score AS score
FROM posts p
JOIN user_category_scores ucs
  ON ucs.category_id = p.category_id AND ucs.user_id = :user_id
WHERE p.author_id != :user_id
  AND p.id NOT IN (
    SELECT post_id FROM post_views WHERE user_id = :user_id
  )
ORDER BY score DESC
LIMIT 20;
```

---

## API

```
GET /feed          — лента (trending или персональная, зависит от авторизации)
GET /feed/trending — всегда глобальный trending
```

Query params:

```
?limit=20
?offset=0
?category=furry    — фильтр по категории (опционально)
```

---

## Логика на уровне сервиса

```
if not authenticated:
    return trending()

scores = getUserCategoryScores(user_id)

if scores is empty:
    return trending()

return personalFeed(user_id)
```
