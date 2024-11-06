#!/bin/bash
docker info > /dev/null 2>&1 || { echo "Docker не запущен ❌ Пожалуйста, запустите Docker и попробуйте снова."; exit 1; }

# Объявляем docker-compose 
DOCKER_COMPOSE_FILE="docker/docker-compose-dev.yaml" # Файл docker-compose
DOCKER_CONTAINER_NAME="imliph-bot-dev" # Имя контейнера

# Удаляем старые контейнеры и образы
docker-compose -f $DOCKER_COMPOSE_FILE -p $DOCKER_CONTAINER_NAME down --remove-orphans && echo "Контейнеры и образы удалены."

# Запускаем контейнеры в фоновом режиме
docker-compose -f $DOCKER_COMPOSE_FILE -p $DOCKER_CONTAINER_NAME up --build && echo "Контейнеры запущены в фоновом режиме."

# Удаляем неиспользуемые образы
docker image prune -f && echo "Неиспользуемые образы удалены."

# Выводим логи контейнера
docker-compose -f $DOCKER_COMPOSE_FILE -p $DOCKER_CONTAINER_NAME logs 

if [ $? -eq 0 ]; then
    echo "" 
    echo ""
    echo "  _____           _ _       _      "
    echo " |_   _|         | (_)     | |     "
    echo "   | |  _ __ ___ | |_ _ __ | |__   "
    echo "   | | | '_ ' _ \| | | '_ \| '_ \  "
    echo "  _| |_| | | | | | | | |_) | | | | "
    echo " |_____|_| |_| |_|_|_| .__/|_| |_| "
    echo "     | |             | |           "
    echo "   __| | _____   __  |_|           "
    echo "  / _' |/ _ \ \ / /                "
    echo " | (_| |  __/\ V /                 "
    echo "  \__,_|\___| \_/🔵"
    echo ""
    echo "   🎉 Удача! 🤖 Бот запущен ⭐"
else
    echo "NOTNOTNOTNOT"
    return 1
fi