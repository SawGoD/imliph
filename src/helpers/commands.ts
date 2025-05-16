import TelegramBot from 'node-telegram-bot-api'
import { buttonTexts as btn, messagesReplies as msg } from '../definitions/constants'
import { validateMessage } from './validates'

export const hello = async (bot: TelegramBot, message: TelegramBot.Message, code?: string): Promise<void> => {
    if (code !== 'help') {
        bot.deleteMessage(message.chat.id, message.message_id).catch(() => {})
        const messageText = msg.hello + '\n' + msg.desc.description
        await bot.sendMessage(message.chat.id, validateMessage(messageText), {
            parse_mode: 'MarkdownV2',
            reply_markup: {
                inline_keyboard: [[{ text: btn.help, url: 'https://t.me/ImliphBot?start=help' }]],
            },
        })
    }
    if (code === 'help') await help(bot, message)
}

export const help = async (bot: TelegramBot, message: TelegramBot.Message): Promise<void> => {
    bot.deleteMessage(message.chat.id, message.message_id).catch(() => {})
    const messageText =
        msg.desc.description +
        '\n' +
        msg.desc.addDescription +
        '\n' +
        msg.desc.favIconDescription +
        '\n\n' +
        msg.desc.supDocExt +
        '\n\n' +
        msg.desc.maxFileSize +
        '\n\n' +
        msg.desc.buttonsDescription()

    await bot.sendMessage(message.chat.id, validateMessage(messageText), {
        parse_mode: 'MarkdownV2',
    })
}
