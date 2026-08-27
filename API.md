# IELTS Backend API

База: `http://localhost:3000`. Swagger: `/api`.
Все ответы — JSON. Все защищённые эндпоинты ждут `Authorization: Bearer <access_token>`.

Валидация глобальная и строгая (`whitelist` + `forbidNonWhitelisted`): любое **лишнее** поле в теле запроса вернёт `400`, а не будет молча проигнорировано. Шлите ровно то, что описано ниже.

---

## Константы

Строки жёстко зафиксированы, произвольные слова больше не принимаются. Источник — [src/exams/constants.ts](src/exams/constants.ts).

### `ExamKind` — тип экзамена

| Значение | Что значит |
|---|---|
| `ACADEMIC` | Academic (по умолчанию) |
| `GENERAL` | General Training — у Reading своя таблица перевода в band |

### `SectionKind` — тип секции

`LISTENING` · `READING` · `WRITING`

### `QuestionKind` — тип вопроса

| Значение | Как рисовать | Нужны `options` |
|---|---|---|
| `MCQ` | радиокнопки, один вариант | да |
| `MULTIPLE_ANSWER` | чекбоксы, несколько вариантов | да |
| `TRUE_FALSE_NOT_GIVEN` | радиокнопки | подставляются сервером |
| `YES_NO_NOT_GIVEN` | радиокнопки | подставляются сервером |
| `MATCHING` | выпадающий список / drag-n-drop | да |
| `LABELLING` | подпись на карте, плане, диаграмме | да |
| `GAP_FILL` | текстовое поле в 1–3 слова (sentence / note / table / form / summary completion) | нет |
| `SHORT_ANSWER` | текстовое поле | нет |
| `ESSAY` | textarea, Writing Task 1 и 2 | нет |

Для `TRUE_FALSE_NOT_GIVEN` и `YES_NO_NOT_GIVEN` сервер сам подставит `["TRUE","FALSE","NOT GIVEN"]` / `["YES","NO","NOT GIVEN"]`, если `options` не прислали. Для остальных типов из колонки «нужны options» пустой список — это `400`.

### `AttemptStatus` — статус попытки

| Значение | Что значит |
|---|---|
| `IN_PROGRESS` | попытка идёт, можно слать черновики |
| `COMPLETED` | сдана, стоит в очереди на проверку |
| `SCORING` | воркер считает баллы |
| `SCORED` | готово, смотри `scores` |
| `SCORING_FAILED` | проверка упала, `scores` не будет |

Жизненный цикл: `IN_PROGRESS → COMPLETED → SCORING → SCORED | SCORING_FAILED`

---

## Auth

### `POST /auth/signup`

```json
{ "email": "user@mail.com", "password": "secret" }
```

→ `201 { "message": "successfully created" }`

Новый пользователь всегда получает роль `user`. Роль `admin` ставится только напрямую в БД.

### `POST /auth/login`

```json
{ "email": "user@mail.com", "password": "secret" }
```

→ `201 { "access_token": "...", "refresh_token": "..." }`

Access живёт 15 минут, refresh — 7 дней. В payload токена лежат `sub` (id пользователя), `email` и `role`.

### `POST /auth/refresh`

```json
{ "refresh_token": "..." }
```

→ `201 { "access_token": "...", "refresh_token": "..." }`

### `GET /auth/status` 🔒

→ payload текущего токена: `{ "sub": "...", "email": "...", "role": "user", "iat": 0, "exp": 0 }`

---

## Exams

Все эндпоинты требуют токен. Создание — только `role: "admin"`.

### `GET /exams` 🔒

Список экзаменов для выбора на дашборде.

```json
[
  { "id": "uuid", "type": "ACADEMIC", "title": "IELTS Academic Test 1", "durationMinutes": 165 }
]
```

### `GET /exams/:id` 🔒

Весь экзамен: секции по возрастанию `partNumber`, вопросы по возрастанию `questionNumber`.

**`correctAnswer` не отдаётся ни на одном публичном эндпоинте.**

```json
{
  "id": "uuid",
  "type": "ACADEMIC",
  "title": "IELTS Academic Test 1",
  "durationMinutes": 165,
  "sections": [
    {
      "id": "uuid",
      "examId": "uuid",
      "type": "LISTENING",
      "partNumber": 1,
      "title": "Part 1",
      "content": "текст для Reading / транскрипт",
      "contentUrl": "https://example.com/audio.mp3",
      "questions": [
        {
          "id": 12,
          "sectionId": "uuid",
          "questionNumber": 1,
          "type": "MCQ",
          "text": "What is the man looking for?",
          "options": ["A flat", "A house", "A room"]
        }
      ]
    }
  ]
}
```

`id` вопроса — **число**, не uuid. Именно его надо слать в `answers[].questionId`.

### `GET /exams/listening/:id` 🔒 · `GET /exams/reading/:id` 🔒 · `GET /exams/writing/:id` 🔒

То же самое, но `sections` отфильтрованы по одному типу. Удобно, если фронт грузит секции по очереди.

### `POST /exams/create-full` 🔒 admin

```json
{
  "title": "IELTS Academic Test 1",
  "type": "ACADEMIC",
  "durationMinutes": 165,
  "sections": [
    {
      "type": "READING",
      "partNumber": 1,
      "title": "Passage 1",
      "content": "Текст пассажа...",
      "contentUrl": null,
      "questions": [
        {
          "questionNumber": 1,
          "type": "TRUE_FALSE_NOT_GIVEN",
          "text": "The author lived in Paris.",
          "correctAnswer": "TRUE"
        },
        {
          "questionNumber": 2,
          "type": "GAP_FILL",
          "text": "The building was finished in ______.",
          "correctAnswer": "1889|eighteen eighty nine"
        },
        {
          "questionNumber": 3,
          "type": "MCQ",
          "text": "What is the main idea?",
          "options": ["Growth", "Decline", "Stability"],
          "correctAnswer": "Growth"
        }
      ]
    },
    {
      "type": "WRITING",
      "partNumber": 2,
      "title": "Task 2",
      "content": null,
      "questions": [
        {
          "questionNumber": 41,
          "type": "ESSAY",
          "text": "Some people think that... Discuss both views.",
          "correctAnswer": "-"
        }
      ]
    }
  ]
}
```

→ `201 { "id": "uuid", "type": "ACADEMIC", "title": "...", "durationMinutes": 165 }`

Правила:

- `durationMinutes` необязателен, по умолчанию `165`. Это лимит на **всю попытку**.
- `correctAnswer` обязателен всегда. Для `ESSAY` он не используется — ставьте `"-"`.
- **Несколько допустимых ответов пишутся через `|`**: `"doctor|a doctor"`, `"TRUE|T"`. При проверке сравнение идёт без учёта регистра, лишних пробелов, знаков препинания и ведущих `a` / `an` / `the` — так что `"doctor"` уже покрывает `"a doctor"`, а `|` нужен для реально разных вариантов.
- `partNumber` у секции определяет номер Writing Task: `partNumber: 1` → Task 1, `partNumber: 2` → Task 2.
- Дубли `(type, partNumber)` у секций и дубли `questionNumber` внутри секции → `400`.

---

## Attempts

Все эндпоинты требуют токен. Пользователь видит и меняет только свои попытки — чужая вернёт `403`.

### `POST /attempts` 🔒

```json
{ "examId": "uuid" }
```

→ созданная попытка. Если у пользователя уже есть `IN_PROGRESS` попытка по этому экзамену — вернётся она же, новая не создастся.

```json
{
  "id": "uuid",
  "userId": "uuid",
  "examId": "uuid",
  "status": "IN_PROGRESS",
  "scores": null,
  "createdAt": "2026-08-27T10:00:00.000Z",
  "expiresAt": "2026-08-27T12:45:00.000Z",
  "finishedAt": null
}
```

`userId` и `status` сервер ставит сам — присылать их нельзя (`400`).
`expiresAt` = `createdAt + exam.durationMinutes`. **Таймер на фронте надо считать от него, а не заводить свой.**

### `PATCH /attempts/:id` 🔒 — автосохранение

```json
{
  "answers": [
    { "questionId": 12, "typeOfSection": "LISTENING", "answerText": "a room" },
    { "questionId": 13, "typeOfSection": "READING", "answerText": "TRUE" }
  ]
}
```

→ `200 { "success": true }`

Апсерт по `(attemptId, questionId)` — можно слать одни и те же вопросы сколько угодно раз, перезапишутся. Можно слать частями.

- попытка уже сдана → `400`
- время вышло → попытка **автоматически** уходит на проверку, в ответ `400 "Attempt time is over, it was submitted automatically"`

### `POST /attempts/finish/:id` 🔒 — сдать

Тело такое же, как у `PATCH` (последняя пачка ответов, можно `{ "answers": [] }`).

→ `201 { "success": true, "attemptId": "uuid", "status": "COMPLETED", "message": "Exam submitted for checking" }`

Проверка асинхронная. Ответ приходит сразу, баллов в нём нет — их надо забрать из `GET /attempts/:id`.

Повторный вызов на уже сданной попытке → `400`. Дубль в очередь не попадёт даже при гонке.

### `GET /attempts/:id` 🔒 — результат

Это тот эндпоинт, который надо поллить после `finish`, пока `status` не станет `SCORED` или `SCORING_FAILED`.

```json
{
  "id": "uuid",
  "userId": "uuid",
  "examId": "uuid",
  "status": "SCORED",
  "createdAt": "2026-08-27T10:00:00.000Z",
  "expiresAt": "2026-08-27T12:45:00.000Z",
  "finishedAt": "2026-08-27T12:30:00.000Z",
  "exam": { "id": "uuid", "title": "IELTS Academic Test 1", "type": "ACADEMIC" },
  "scores": {
    "listening": 7.0,
    "reading": 6.5,
    "writing": {
      "band": 6.5,
      "tasks": [
        {
          "task": 1,
          "band": 6.0,
          "taskResponse": 6,
          "coherence": 6,
          "lexical": 6,
          "grammar": 6,
          "feedback": "..."
        },
        {
          "task": 2,
          "band": 7.0,
          "taskResponse": 7,
          "coherence": 7,
          "lexical": 7,
          "grammar": 7,
          "feedback": "..."
        }
      ]
    },
    "overall": 6.5
  },
  "answers": [
    { "questionId": 12, "typeOfSection": "LISTENING", "answerText": "a room", "isCorrect": true }
  ]
}
```

- `scores` равен `null`, пока статус не `SCORED`.
- В `scores` есть только те секции, которые реально были в экзамене. Нет Writing в тесте — не будет и `scores.writing`.
- `scores.writing.band` = `(Task1 + 2 × Task2) / 3`, округлённое до половины балла. Если задание одно — его собственный band.
- `scores.overall` — среднее по доступным модулям, округлённое до половины.
- `isCorrect` проставляет сервер после проверки. До этого `null`. Для `WRITING` всегда `null`.

### `GET /attempts/mine` 🔒 — история

Список попыток пользователя, новые сверху, с названием экзамена. Формат элемента тот же, что у `GET /attempts/:id`, но без `answers`.

---

## Как это склеивается на фронте

```
GET   /exams                           выбрать экзамен
POST  /attempts { examId }             -> attempt.id, attempt.expiresAt
GET   /exams/:examId                   секции и вопросы
      ... таймер от expiresAt ...
PATCH /attempts/:id { answers }        каждые N секунд, автосохранение
POST  /attempts/finish/:id { answers } сдать
GET   /attempts/:id                    поллить, пока status !== SCORED
```

## Прочее

- **CORS** разрешён только для `http://localhost:3001` и `http://127.0.0.1:3001` — см. [src/main.ts](src/main.ts).
- **Bull Board** на `/admin/queues` под HTTP basic auth (`BULL_BOARD_USER` / `BULL_BOARD_PASSWORD`).
- Переменные окружения — [.env.example](.env.example).
