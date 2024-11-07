import axios from 'axios'
import { messagesReplies as msg } from '../definitions/constants'

/**
 * Downloads the favicon from the specified URL.
 *
 * @param domain - The domain to fetch the favicon for.
 * @param size - The desired size of the favicon.
 * @returns {Promise<{ faviconBuffer: Buffer; title: string }>} -
 * A promise that resolves to an object containing the favicon as a Buffer and its title.
 */
const downloadFavicon = async (domain: string, size: number): Promise<{ faviconBuffer: Buffer; title: string }> => {
    const url = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domain}&size=${size}`
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const faviconBuffer = Buffer.from(response.data)
    const title = `${msg.faviconName}(${domain.split('/')[2]})` || msg.faviconName
    return { faviconBuffer, title }
}

/**
 * Attempts to download the favicon from the specified URL using various sizes.
 *
 * @param url - The URL to fetch the favicon for.
 * @returns {Promise<{ faviconBuffer: Buffer; title: string } | undefined>} -
 * A promise that resolves to the favicon data and title if successful, or undefined if all attempts fail.
 */
export const tryDownloadFavicon = async (url: string) => {
    const sizes = [256, 128, 64, 32, 16]
    const requests = sizes.map((size) =>
        downloadFavicon(url, size).catch(() => {
            // console.error(`Не удалось скачать с размером: ${size}`)
            return undefined
        })
    )
    const results = await Promise.all(requests)
    return results.find((result) => result !== undefined)
}
