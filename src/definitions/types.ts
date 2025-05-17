import TelegramBot from 'node-telegram-bot-api'

export type ctxMessage = TelegramBot.Message

export type CTX = TelegramBot & { message: ctxMessage }

export interface ImgBBResponse {
    id: string
    title: string
    url_viewer: string
    url: string
    display_url: string
    size: number
    time: number
    expiration: number
    image: {
        filename: string
        name: string
        mime: string
        extension: string
        url: string
    }
    thumb: {
        filename: string
        name: string
        mime: string
        extension: string
        url: string
    }
    delete_url: string
}
