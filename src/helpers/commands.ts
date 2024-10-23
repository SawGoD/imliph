import { buttonTexts as btn, messagesReplies as msg } from '../definitions/constants'
import { validateMessage } from './validates'

export const hello = async (ctx: any, code: any) => {
    if (code !== 'help') {
        ctx.deleteMessage().catch(() => {})
        const message = msg.hello + '\n' + msg.desc.description
        await ctx.replyWithMarkdownV2(validateMessage(message), {
            reply_markup: {
                inline_keyboard: [[{ text: btn.help, url: 'https://t.me/TF_SGD_BOT?start=help' }]],
            },
        })
    }
    if (code === 'help') await help(ctx)
}

export const help = async (ctx: any) => {
    ctx.deleteMessage().catch(() => {})
    const message =
        msg.desc.description +
        '\n' +
        msg.desc.addDescription +
        '\n\n' +
        msg.desc.supDocExt +
        '\n\n' +
        msg.desc.maxFileSize +
        '\n\n' +
        msg.desc.buttonsDescription()
    await ctx.replyWithMarkdownV2(validateMessage(message), {})
}
