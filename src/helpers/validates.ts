import { messagesReplies as msg } from '../definitions/constants'

/**
 * Проверяет расширение файла на допустимость.
 *
 * @param fileName - Имя файла для проверки.
 * @param ctx - Контекст для отправки сообщения пользователю.
 * @returns {boolean} - Возвращает true, если расширение допустимо, иначе false.
 */
export const validateExtension = (fileName: string, ctx: any): boolean => {
    const isValid = ['.jpeg', '.jpg', '.png', '.ico'].includes(fileName.slice(-4).toLowerCase())
    const message = msg.badDocExtension + '\n' + msg.desc.supDocExt
    !isValid && ctx.replyWithMarkdownV2(validateMessage(message), { reply_to_message_id: ctx.message.message_id })
    return isValid
}

/**
 * Проверяет сообщение на наличие ошибок, экранируя символы, которые не поддерживаются ботом.
 *
 * @param message - Сообщение для проверки.
 * @returns - Сообщение с экранированными символами.
 */
export const validateMessage = (message: string) => message.replace(/[!.()-]/g, '\\$&')
