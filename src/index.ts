import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { botToken } from './environment'
import { handleImage, handleUrl } from './handlers'
import { hello, help } from './helpers/commands'

const bot = new Telegraf(botToken as string)

// Команды
bot.hears('/start', hello)
bot.hears('/start help', (ctx) => hello(ctx, 'help'))
bot.hears('/help', help)

// Обработчики
bot.on(message('photo'), handleImage)
bot.on(message('document'), handleImage)
bot.on(message('text'), handleUrl)

// Запуск бота
bot.launch()
console.log('➖ ➖ ➖  Бот запущен➖ ➖ ➖')
