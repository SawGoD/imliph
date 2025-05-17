import axios from 'axios'
import { messagesReplies as msg } from '../definitions/constants'

export interface FaviconResult {
    faviconBuffer: Buffer
    title: string
}

/**
 * Возвращает домен из URL строки
 *
 * @param url - URL для извлечения домена.
 * @returns {string} - Извлеченный домен или 'site' если не удалось извлечь.
 */
const extractDomain = (url: string): string => {
    try {
        const domainMatch = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im)
        return domainMatch && domainMatch[1] ? domainMatch[1] : 'site'
    } catch (e) {
        return 'site'
    }
}

/**
 * Downloads the favicon from the specified URL.
 *
 * @param domain - The domain to fetch the favicon for.
 * @param size - The desired size of the favicon.
 * @returns {Promise<FaviconResult>} -
 * A promise that resolves to an object containing the favicon as a Buffer and its title.
 */
const downloadFavicon = async (domain: string, size: number): Promise<FaviconResult> => {
    const url = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domain}&size=${size}`
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const faviconBuffer = Buffer.from(response.data)

    let title: string

    try {
        // Попытка извлечь домен для более понятного имени файла
        const domain_part = extractDomain(domain)
        title = `${msg.faviconName}_${domain_part}`
    } catch (e) {
        // В случае ошибки используем дефолтное имя
        title = msg.faviconName
    }

    return { faviconBuffer, title }
}

/**
 * Attempts to download the favicon from the specified URL using various sizes.
 *
 * @param url - The URL to fetch the favicon for.
 * @returns {Promise<FaviconResult | null>} -
 * A promise that resolves to the favicon data and title if successful, or null if all attempts fail.
 */
export const tryDownloadFavicon = async (url: string): Promise<FaviconResult | null> => {
    const sizes = [256, 128, 64, 32, 16]
    const requests = sizes.map((size) =>
        downloadFavicon(url, size).catch(() => {
            // console.error(`Не удалось скачать с размером: ${size}`)
            return null
        })
    )
    const results = await Promise.all(requests)
    return results.find((result) => result !== null) || null
}
