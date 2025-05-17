import TelegramBot from 'node-telegram-bot-api'
import { botToken } from './environment'
import { handleImage, handleUrl } from './handlers'
import { hello, help } from './helpers/commands'
import { handleSticker } from './helpers/downloadSticker'

// Отключаем предупреждения о deprecation (устаревших функциях)
process.env['NTBA_FIX_319'] = '1' // Предупреждение о файлах с именем "filename"
process.env['NTBA_FIX_350'] = '1' // Предупреждение о content-type для файлов

const bot = new TelegramBot(botToken as string, { polling: true })

// Команды
bot.onText(/^\/start$/, (msg) => hello(bot, msg))
bot.onText(/^\/start help$/, (msg) => hello(bot, msg, 'help'))
bot.onText(/^\/help$/, (msg) => help(bot, msg))

// Обработчики для фотографий и документов
bot.on('photo', (msg) => handleImage(bot, msg))
bot.on('document', (msg) => handleImage(bot, msg))

// Обработчик для стикеров
bot.on('sticker', (msg) => {
    if (msg.sticker && msg.sticker.file_id) {
        handleSticker(bot, msg, msg.sticker.file_id)
    }
})

// Обработчик для текстовых сообщений (проверка ссылок)
bot.on('text', (msg) => handleUrl(bot, msg))

console.log('➖ ➖ ➖  Бот запущен➖ ➖ ➖')
