import dotenv from 'dotenv'

dotenv.config()

export const botToken = process.env['TELEGRAM_TOKEN']
export const imgbbApiKey = process.env['IMGBB_API_KEY']
