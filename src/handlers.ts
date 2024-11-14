import axios from 'axios'
import { action, buttonTexts as btn, messagesReplies as msg } from './definitions/constants'
import { CTX } from './definitions/types'
import { botToken } from './environment'
import { tryDownloadFavicon } from './helpers/downloadFavicon'
import { uploadToImgBB } from './helpers/uploadImage'
import { validateMessage } from './helpers/validates'

/**
 * Sends the user a message with a link to the image and buttons to share it or view its details.
 *
 * @param ctx - The Telegraf context.
 * @param message - The message to be sent to the user.
 * @param imgLink - The link to the image hosted on imgBB.
 * @param imgDelLink - The link to the deletion page for the image on imgBB.
 * @returns {Promise<void>} - A promise that resolves when the message has been sent.
 */
const sendGoodUrlMessage = async (ctx: any, message: string, imgLink: string, imgDelLink: string) => {
    await ctx.replyWithMarkdownV2(message, {
        reply_markup: {
            inline_keyboard: [[{ text: btn.share, switch_inline_query: msg.sharedUrl(imgLink) }], [{ text: btn.detailed, url: imgDelLink }]],
        },
    })
}

/**
 * Sends the favicon file from the specified URL to the context.
 *
 * @param ctx - The context object used for sending messages.
 * @param url - The URL to download the favicon from.
 */
const sendFaviconFile = async (ctx: CTX, url: string) => {
    const faviconBuffer = await tryDownloadFavicon(url)
    faviconBuffer
        ? await ctx.replyWithDocument({ source: faviconBuffer.faviconBuffer, filename: `${faviconBuffer.title}.ico` })
        : await ctx.replyWithMarkdownV2(validateMessage(msg.badDownload))
}

/**
 * Handles all types of messages by running the appropriate function for each one.
 *
 * @param ctx - The Telegraf context.
 * @returns {Promise<void>} - A promise that resolves when all the functions have been called.
 */
export const handleImage = (ctx: CTX) =>
    Promise.all(Object.keys(ctx.message).map((key) => action[key]?.(ctx, ctx.message[key]))).catch((e) => console.log(e))

/**
 * Handles the URL extraction from a message and sends the corresponding favicon.
 *
 * @param ctx - The context object containing the message data.
 */
export const handleUrl = async (ctx: CTX) => {
    const text = ctx.message.text
    const regex = /(https?:\/\/[^\s]+)/g
    const url = text.match(regex)
    if (url) {
        sendFaviconFile(ctx, url[0])
        // ctx.reply(url, { reply_to_message_id: ctx.message.message_id })
    } else {
        ctx.reply(msg.noLinks, { reply_to_message_id: ctx.message.message_id })
    }
}

/**
 * Processes the image by retrieving it from Telegram, uploading it to imgBB, and sending the user a message with the image link.
 *
 * @param ctx - The Telegraf context.
 * @param fileId - The file ID of the image.
 * @returns {Promise<void>} - A promise that resolves when the image has been processed.
 */
export const processImage = (ctx: CTX, fileId: string) =>
    (ctx.telegram.getFile(fileId) as Promise<any>)
        .then((file: any) => file.file_path as string)
        .then((filePath) => `https://api.telegram.org/file/bot${botToken}/${filePath}`)
        .then((url) => axios.get(url, { responseType: 'arraybuffer' }))
        .then((response) => Buffer.from(response.data))
        .then((fileBuffer) => uploadToImgBB(fileBuffer))
        .then((uploadData) => sendGoodUrlMessage(ctx, msg.goodUpload(uploadData.url), uploadData.url, uploadData.delete_url))
        .then(() => ctx.deleteMessage())
