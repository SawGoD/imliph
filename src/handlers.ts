import axios from 'axios'
import * as fs from 'fs'
import TelegramBot from 'node-telegram-bot-api'
import * as os from 'os'
import * as path from 'path'
import { buttonTexts as btn, messagesReplies } from './definitions/constants'
import { botToken } from './environment'
import { FaviconResult, tryDownloadFavicon } from './helpers/downloadFavicon'
import { uploadToImgBB } from './helpers/uploadImage'
import { validateMessage } from './helpers/validates'

/**
 * Отправляет пользователю сообщение со ссылкой на изображение и кнопками для его публикации или просмотра подробностей.
 *
 * @param bot - Экземпляр TelegramBot для отправки сообщений.
 * @param chatId - ID чата, в который нужно отправить сообщение.
 * @param message - Сообщение для отправки пользователю.
 * @param imgLink - Ссылка на изображение, размещенное на imgBB.
 * @param imgDelLink - Ссылка для удаления изображения на imgBB.
 * @returns {Promise<void>} - Promise, который разрешается после отправки сообщения.
 */
const sendGoodUrlMessage = async (bot: TelegramBot, chatId: number, message: string, imgLink: string, imgDelLink: string): Promise<void> => {
    await bot.sendMessage(chatId, message, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
            inline_keyboard: [
                [{ text: btn.share, switch_inline_query: messagesReplies.sharedUrl(imgLink) }],
                [{ text: btn.detailed, url: imgDelLink }],
            ],
        },
    })
}

/**
 * Отправляет файл иконки по указанному URL в контекст.
 *
 * @param bot - Экземпляр TelegramBot для отправки сообщений.
 * @param msg - Сообщение от пользователя.
 * @param url - URL для загрузки иконки.
 */
const sendFaviconFile = async (bot: TelegramBot, msg: TelegramBot.Message, url: string): Promise<void> => {
    try {
        const faviconResult: FaviconResult | null = await tryDownloadFavicon(url)
        if (faviconResult && faviconResult.faviconBuffer) {
            // Создаем временный файл для иконки с правильным именем
            // Это решает проблему с отправкой файла и его именем
            const fileName = `${faviconResult.title}.ico`
            const tempFilePath = path.join(os.tmpdir(), fileName)

            try {
                // Записываем буфер во временный файл
                fs.writeFileSync(tempFilePath, faviconResult.faviconBuffer)

                // Отправляем файл с корректным именем
                // При отправке физического файла библиотека node-telegram-bot-api
                // автоматически использует имя файла из пути
                const fileOptions: TelegramBot.SendDocumentOptions = {
                    caption: `Favicon для ${url}`,
                }

                // Отправка файла с диска (расширение файла .ico определит тип автоматически)
                await bot.sendDocument(msg.chat.id, tempFilePath, fileOptions)

                // Удаляем временный файл после отправки
                fs.unlinkSync(tempFilePath)
            } catch (fileError) {
                console.error('Ошибка при работе с файлом:', fileError)

                try {
                    // Пробуем отправить как фото - это часто работает для иконок
                    const photoOptions: TelegramBot.SendPhotoOptions = {
                        caption: `Favicon для ${url}`,
                    }
                    await bot.sendPhoto(msg.chat.id, faviconResult.faviconBuffer, photoOptions)
                } catch (photoError) {
                    console.error('Не удалось отправить как фото:', photoError)

                    // Если не удалось отправить как файл или фото
                    // Попробуем загрузить на imgBB и отправить ссылку
                    try {
                        const uploadData = await uploadToImgBB(faviconResult.faviconBuffer)
                        await bot.sendMessage(msg.chat.id, `Favicon для ${url}\nСсылка: ${uploadData.url}`, {
                            reply_to_message_id: msg.message_id,
                        })
                    } catch (uploadError) {
                        console.error('Не удалось загрузить на imgBB:', uploadError)
                        await bot.sendMessage(msg.chat.id, 'Не удалось отправить иконку. Попробуйте позже.', {
                            reply_to_message_id: msg.message_id,
                        })
                    }
                }
            }
        } else {
            await bot.sendMessage(msg.chat.id, validateMessage(messagesReplies.badDownload), { parse_mode: 'MarkdownV2' })
        }
    } catch (error) {
        console.error('Ошибка при отправке иконки:', error)
        await bot.sendMessage(msg.chat.id, validateMessage(messagesReplies.badDownload), { parse_mode: 'MarkdownV2' })
    }
}

/**
 * Обрабатывает все типы сообщений, запуская соответствующую функцию для каждого из них.
 *
 * @param bot - Экземпляр TelegramBot.
 * @param msg - Сообщение от пользователя.
 * @returns {Promise<void[]>} - Promise, который разрешается после вызова всех функций.
 */
export const handleImage = async (bot: TelegramBot, msg: TelegramBot.Message): Promise<void[]> => {
    const promises: Promise<void>[] = []

    if (msg.photo && msg.photo.length > 0) {
        const photoFileId = msg.photo[msg.photo.length - 1]?.file_id
        if (photoFileId) {
            promises.push(processImage(bot, msg, photoFileId))
        }
    }

    if (msg.document) {
        promises.push(processImage(bot, msg, msg.document.file_id))
    }

    return Promise.all(promises).catch((e) => {
        console.log(e)
        return []
    })
}

/**
 * Обрабатывает извлечение URL из сообщения и отправляет соответствующую иконку.
 *
 * @param bot - Экземпляр TelegramBot.
 * @param msg - Сообщение от пользователя.
 */
export const handleUrl = async (bot: TelegramBot, msg: TelegramBot.Message): Promise<void> => {
    if (!msg.text) return

    const text = msg.text
    const regex = /(https?:\/\/[^\s]+)/g
    const url = text.match(regex)

    if (url) {
        sendFaviconFile(bot, msg, url[0])
    } else {
        bot.sendMessage(msg.chat.id, messagesReplies.noLinks, { reply_to_message_id: msg.message_id })
    }
}

/**
 * Обрабатывает изображение, получая его из Telegram, загружая на imgBB и отправляя пользователю сообщение со ссылкой на изображение.
 *
 * @param bot - Экземпляр TelegramBot.
 * @param msg - Сообщение от пользователя.
 * @param fileId - ID файла изображения.
 * @returns {Promise<void>} - Promise, который разрешается после обработки изображения.
 */
export const processImage = async (bot: TelegramBot, msg: TelegramBot.Message, fileId: string): Promise<void> => {
    try {
        const file = await bot.getFile(fileId)

        if (!file.file_path) {
            throw new Error('Не удалось получить путь к файлу')
        }

        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`

        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })
        const fileBuffer = Buffer.from(response.data)

        const uploadData = await uploadToImgBB(fileBuffer)

        await sendGoodUrlMessage(bot, msg.chat.id, messagesReplies.goodUpload(uploadData.url), uploadData.url, uploadData.delete_url)
        await bot.deleteMessage(msg.chat.id, msg.message_id)
    } catch (error) {
        console.error('Ошибка при обработке изображения:', error)
        await bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке изображения.')
    }
}
