import TelegramBot from 'node-telegram-bot-api'
import { processImage } from '../handlers'
import { validateExtension } from '../helpers/validates'

export const messagesReplies = {
    hello: '*Привет!*',
    desc: {
        description: 'Это бот для загрузки изображений на imgBB. \nПросто отправь картинку в чат!',
        addDescription: '_Можно отправить несколько файлов в одном сообщении._\n_Сервис поддерживает файлы с прозрачным фоном._',
        favIconDescription: '_Ещё можно скачать иконоку( favicon ) любого сайта. Отправь ссылку на сайт и получи его иконку!_',
        supDocExt:
            '*• Поддерживаемые форматы файла:* \nПри отправке изображений без сжатия, убедитесь, что они имеют расширение `.jpeg`, `.jpg`, `.png` или `.ico`.',
        maxFileSize: '*• Максимальный размер файла:* \n32МБ',
        buttonShare: '\n__Поделиться__ - Вы можете отправить ссылку на изображение в другой чат',
        buttonDetailed: '\n__Подробнее__ - дополнительные форматы ссылок, скачать оригинал, удалить изображение',
        buttonsDescription: function () {
            return `*• Кнопки бота:*${this.buttonShare}${this.buttonDetailed}`
        },
    },

    // buttonsDescription: '*Кнопки бота:* \n__Поделиться__ \n__Подробнее__',
    // Сообщения для обработки изображений
    goodUpload: (url: string) => `Ссылка на изображение: [⠀](${url}) \n\`${url}\``,
    badUploadPhoto: 'Произошла ошибка при обработке изображения.',
    badUploadDoc: 'Произошла ошибка при обработке документа.',
    badDocExtension: '*Неподходящее расширение!*',
    sharedUrl: (url: string) => `Ссылка на изображение: \n${url}`,

    // Сообщения связанные с иконками
    goodDownload: '',
    badDownload: '*Не удалось скачать иконку.* \nВозможно, она отсутствует на сайте.',
    faviconName: 'favicon',
    noLinks: 'Не получилось найти ссылки в сообщении.',
}

export const buttonTexts = {
    share: 'Поделиться',
    detailed: 'Подробнее',
    help: 'Помощь',
}

export const action: { [key: string]: (bot: TelegramBot, msg: TelegramBot.Message, data: any) => void } = {
    photo: (bot, msg, photos) => {
        const lastPhoto = Array.isArray(photos) ? photos[photos.length - 1] : photos
        processImage(bot, msg, lastPhoto.file_id).catch(() => bot.sendMessage(msg.chat.id, messagesReplies.badUploadPhoto))
    },
    document: (bot, msg, document) => {
        if (!validateExtension(document.file_name, bot, msg)) return
        processImage(bot, msg, document.file_id).catch(() => bot.sendMessage(msg.chat.id, messagesReplies.badUploadDoc))
    },
}
