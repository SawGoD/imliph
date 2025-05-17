import TelegramBot from 'node-telegram-bot-api'

export type ctxMessage = TelegramBot.Message

export type CTX = TelegramBot & { message: ctxMessage }
