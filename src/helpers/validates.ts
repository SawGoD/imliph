import TelegramBot from 'node-telegram-bot-api'
import { messagesReplies as msg } from '../definitions/constants'

/**
 * Проверяет расширение файла на допустимость.
 *
 * @param fileName - Имя файла для проверки.
 * @param bot - Экземпляр TelegramBot для отправки сообщений.
 * @param message - Сообщение от пользователя.
 * @returns {boolean} - Возвращает true, если расширение допустимо, иначе false.
 */
export const validateExtension = (fileName: string, bot: TelegramBot, message: TelegramBot.Message): boolean => {
    const isValid = ['.jpeg', '.jpg', '.png', '.ico'].includes(fileName.slice(-4).toLowerCase())
    const replyMessage = msg.badDocExtension + '\n' + msg.desc.supDocExt

    if (!isValid) {
        bot.sendMessage(message.chat.id, validateMessage(replyMessage), {
            parse_mode: 'MarkdownV2',
            reply_to_message_id: message.message_id,
        })
    }

    return isValid
}

/**
 * Проверяет сообщение на наличие ошибок, экранируя символы, которые не поддерживаются ботом.
 *
 * @param message - Сообщение для проверки.
 * @returns - Сообщение с экранированными символами.
 */
export const validateMessage = (message: string): string => message.replace(/[!.()-]/g, '\\$&')
