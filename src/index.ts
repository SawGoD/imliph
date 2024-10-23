import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { botToken } from './environment'
import { handleImage } from './handlers'
import { hello, help } from './helpers/commands'

const bot = new Telegraf(botToken as string)

// Обработчики
bot.on(message('photo'), handleImage)
bot.on(message('document'), handleImage)

// Команды
bot.hears('/start', hello)
bot.hears('/start help', (ctx) => hello(ctx, 'help'))
bot.hears('/help', help)

// Запуск бота
bot.launch()
console.log('➖ ➖ ➖  Бот запущен➖ ➖ ➖')
