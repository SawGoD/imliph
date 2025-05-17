import * as ffmpegPath from '@ffmpeg-installer/ffmpeg'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'
import TelegramBot from 'node-telegram-bot-api'
import * as os from 'os'
import * as path from 'path'
import sharp from 'sharp'
import { messagesReplies as messages } from '../definitions/constants'
import { botToken } from '../environment'

// Устанавливаем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path)

export interface StickerResult {
    fileBuffer: Buffer
    title: string
    isAnimated: boolean
    format: string
}

/**
 * Безопасное удаление файла с проверкой его существования
 *
 * @param filePath - Путь к файлу для удаления
 */
const safeUnlink = (filePath: string): void => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
    } catch (error) {
        console.error(`Не удалось удалить файл ${filePath}:`, error)
    }
}

/**
 * Безопасная отправка сообщения с проверкой на ошибки Telegram
 *
 * @param bot - Экземпляр TelegramBot
 * @param chatId - ID чата
 * @param message - Сообщение для отправки
 * @param options - Опции отправки
 * @returns {Promise<boolean>} - Успешность отправки
 */
const safeSendMessage = async (
    bot: TelegramBot,
    chatId: number,
    message: string,
    options?: TelegramBot.SendMessageOptions
): Promise<boolean> => {
    try {
        await bot.sendMessage(chatId, message, options)
        return true
    } catch (error) {
        if (error instanceof Error && error.message.includes('ETELEGRAM')) {
            console.error('Ошибка Telegram API:', error.message)
        } else {
            console.error('Ошибка при отправке сообщения:', error)
        }
        return false
    }
}

/**
 * Скачивает стикер из Telegram
 *
 * @param bot - Экземпляр TelegramBot для получения файла
 * @param fileId - ID файла стикера
 * @returns {Promise<StickerResult>} - Объект с данными стикера
 */
export const downloadSticker = async (bot: TelegramBot, fileId: string): Promise<StickerResult> => {
    const file = await bot.getFile(fileId)

    if (!file.file_path) {
        throw new Error('Не удалось получить путь к файлу стикера')
    }

    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })
    const fileBuffer = Buffer.from(response.data)

    const ext = path.extname(file.file_path).toLowerCase()
    const isAnimated = ext === '.tgs' || ext === '.webm'
    const format = ext.replace('.', '')
    const title = `sticker_${Date.now()}`

    return { fileBuffer, title, isAnimated, format }
}

/**
 * Конвертирует обычный стикер в PNG
 *
 * @param stickerBuffer - Буфер стикера
 * @returns {Promise<Buffer>} - Буфер PNG изображения
 */
export const convertStickerToPng = async (stickerBuffer: Buffer): Promise<Buffer> => {
    return await sharp(stickerBuffer).png().toBuffer()
}

/**
 * Конвертирует анимированный стикер в GIF
 *
 * @param stickerBuffer - Буфер стикера
 * @param format - Формат стикера ('tgs' или 'webm')
 * @returns {Promise<Buffer>} - Буфер GIF анимации
 */
export const convertStickerToGif = async (stickerBuffer: Buffer, format: string): Promise<Buffer> => {
    const tempDir = os.tmpdir()
    const tempInputPath = path.join(tempDir, `sticker_${Date.now()}.${format}`)
    const tempOutputPath = path.join(tempDir, `sticker_${Date.now()}.gif`)

    fs.writeFileSync(tempInputPath, stickerBuffer)

    return new Promise<Buffer>((resolve, reject) => {
        const command = ffmpeg(tempInputPath)
            .outputOptions(['-vf', 'scale=512:-1:flags=lanczos', '-f', 'gif'])
            .on('error', (_err: Error) => {
                safeUnlink(tempInputPath)
                reject(new Error(''))
            })
            .on('end', () => {
                try {
                    const gifBuffer = fs.readFileSync(tempOutputPath)
                    // Удаляем временные файлы
                    safeUnlink(tempInputPath)
                    safeUnlink(tempOutputPath)
                    resolve(gifBuffer)
                } catch (e) {
                    reject(new Error(`Ошибка при чтении готового GIF файла: ${e}`))
                }
            })

        command.save(tempOutputPath)
    })
}

/**
 * Обрабатывает стикер и отправляет его в виде файла и изображения/gif
 *
 * @param bot - Экземпляр TelegramBot
 * @param msg - Сообщение пользователя
 * @param fileId - ID файла стикера
 */
export const handleSticker = async (bot: TelegramBot, msg: TelegramBot.Message, fileId: string): Promise<void> => {
    let tempFilePath = ''
    let tempImagePath = ''

    try {
        // Скачиваем стикер
        const stickerResult = await downloadSticker(bot, fileId)

        // Подготавливаем буферы для отправки файла и изображения/gif
        let fileBuffer = stickerResult.fileBuffer
        let imageBuffer: Buffer
        let fileExt = stickerResult.format
        let imageExt = 'png'

        // Конвертируем стикер в зависимости от формата
        if (stickerResult.isAnimated) {
            // Всегда конвертируем в GIF для отображения
            imageBuffer = await convertStickerToGif(fileBuffer, stickerResult.format)
            imageExt = 'gif'

            // Обработка файла зависит от типа стикера
            if (fileExt === 'tgs') {
                // Для tgs оставляем как есть (оригинальный tgs-файл)
                fileExt = 'tgs'
            } else if (fileExt === 'webm') {
                // Для webm используем оригинальный webm
                fileExt = 'webm'
                // fileBuffer уже содержит оригинальный webm, ничего не меняем
            }
        } else {
            // Для обычных стикеров конвертируем в PNG
            imageBuffer = await convertStickerToPng(fileBuffer)
            fileBuffer = imageBuffer
            fileExt = 'png'
        }

        // Создаем временные файлы для отправки
        const fileName = `${stickerResult.title}.${fileExt}`
        const imageName = `${stickerResult.title}.${imageExt}`
        tempFilePath = path.join(os.tmpdir(), fileName)
        tempImagePath = path.join(os.tmpdir(), imageName)

        // Записываем буферы во временные файлы
        fs.writeFileSync(tempFilePath, fileBuffer)
        fs.writeFileSync(tempImagePath, imageBuffer)

        // Отправляем как документ
        try {
            const fileOptions: TelegramBot.SendDocumentOptions = {
                caption: messages.stickerFile,
            }
            await bot.sendDocument(msg.chat.id, tempFilePath, fileOptions)

            // Отправляем как изображение или GIF
            if (imageExt === 'gif') {
                const animationOptions: TelegramBot.SendAnimationOptions = {
                    caption: messages.stickerGif,
                }
                await bot.sendAnimation(msg.chat.id, tempImagePath, animationOptions)
            } else {
                const photoOptions: TelegramBot.SendPhotoOptions = {
                    caption: messages.stickerImage,
                }
                await bot.sendPhoto(msg.chat.id, tempImagePath, photoOptions)
            }
        } catch (sendError) {
            if (sendError instanceof Error && sendError.message.includes('ETELEGRAM')) {
                console.error('Ошибка Telegram API при отправке файлов:', sendError.message)
            } else {
                console.error('Ошибка при отправке файлов:', sendError)
                // Отправляем сообщение об ошибке только если это не ошибка ETELEGRAM
                await safeSendMessage(bot, msg.chat.id, messages.stickerError, { reply_to_message_id: msg.message_id })
            }
        } finally {
            // Удаляем временные файлы в любом случае
            safeUnlink(tempFilePath)
            safeUnlink(tempImagePath)
        }
    } catch (error) {
        console.error('Ошибка при обработке стикера:', error)

        // Удаляем временные файлы, если они существуют
        if (tempFilePath) safeUnlink(tempFilePath)
        if (tempImagePath) safeUnlink(tempImagePath)

        if (!error || !(error instanceof Error) || !error.message.includes('ETELEGRAM')) {
            // Отправляем сообщение об ошибке только если это не ошибка ETELEGRAM
            await safeSendMessage(bot, msg.chat.id, messages.stickerError, { reply_to_message_id: msg.message_id })
        }
    }
}
