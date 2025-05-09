# Используем легкий образ Node.js
FROM node:20-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование файлов package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Указываем порт для разработки
EXPOSE 5173

# Запуск в режиме разработки
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 