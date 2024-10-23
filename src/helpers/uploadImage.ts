import axios from 'axios'
import FormData from 'form-data'
import { imgbbApiKey } from '../environment'

/**
 * Uploads a buffer of an image to imgBB and returns the response data.
 *
 * @param fileBuffer - The buffer of the image to be uploaded.
 * @returns The response data from imgBB.
 * @throws {Error} If the image could not be uploaded.
 */
export const uploadToImgBB = async (fileBuffer: Buffer) => {
    const formData = new FormData()
    formData.append('image', fileBuffer.toString('base64'))

    try {
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, formData, {
            headers: formData.getHeaders(),
        })
        return response.data.data
    } catch (error) {
        throw new Error('Не удалось загрузить изображение.')
    }
}
