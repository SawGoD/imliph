import { processImage } from '../handlers'
import { validateExtension } from '../helpers/validates'
import { CTX, ctxMessage } from './types'

export const messagesReplies = {
    hello: '*Привет!*',
    desc: {
        description: 'Это бот для загрузки изображений на imgBB. \nПросто отправь картинку в чат!',
        addDescription: '_Можно отправить несколько файлов в одном сообщении._\n_Сервис поддерживает файлы с прозрачным фоном._',
        supDocExt:
            '*• Поддерживаемые форматы файла:* \nПри отправке изображений без сжатия, убедитесь, что они имеют расширение `.jpeg`, `.jpg` или `.png`.',
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
    badDownload: '*Не удалось скачать иконку.* \nВозможно, она отсутствует на сайте.',
    faviconName: 'favicon',
    noLinks: 'Не получилось найти ссылки в сообщении.',
}

export const buttonTexts = {
    share: 'Поделиться',
    detailed: 'Подробнее',
    help: 'Помощь',
}

export const action: { [key: string]: Function } = {
    photo: (ctx: CTX, photos: ctxMessage['photo']) => {
        processImage(ctx, photos.pop()!.file_id as string).catch(() => ctx.reply(`${messagesReplies.badUploadPhoto}`))
    },
    document: (ctx: CTX, document: ctxMessage['document']) => {
        if (!validateExtension(document.file_name as string, ctx)) return
        processImage(ctx, document.file_id).catch(() => ctx.reply(`${messagesReplies.badUploadDoc}`))
    },
}
