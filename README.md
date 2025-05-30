# Leaky Bucket Algorithm Visualizer

Визуализатор алгоритма "протекающего ведра" (Leaky Bucket) с интерактивным интерфейсом.

## Структура проекта

- `react-frontend/` - React приложение с визуализацией
- `go-backend/` - Go сервер, реализующий алгоритм

## Локальная разработка

### Backend (Go)

```bash
cd go-backend
go run server.go
```

Сервер запустится на порту 8080.

### Frontend (React)

```bash
cd react-frontend
npm install
npm start
```

Приложение будет доступно по адресу http://localhost:3000

## Деплой

Проект настроен для деплоя на:
- Frontend: Vercel
- Backend: Render.com

## Технологии

- Frontend:
  - React
  - Recharts для графиков
  - Axios для HTTP запросов

- Backend:
  - Go
  - Стандартная библиотека net/http

## Автор

Ruslan Akhmetov
- GitHub: [rus1kkk](https://github.com/rus1kkk)
- Проект создан во время стажировки в [ITpelag](https://itpelag.com) 