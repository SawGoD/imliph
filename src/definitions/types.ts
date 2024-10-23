export type ctxMessage = {
    message: {
        message_id: number
        from: {
            id: number
            is_bot: boolean
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
        }
    }
    message_id: number
    from: {
        id: number
        is_bot: boolean
        first_name: string
        last_name?: string
        username?: string
        language_code?: string
        is_premium?: boolean
    }
    chat: {
        id: number
        first_name: string
        last_name?: string
        username?: string
        type: string
    }
    date: number
    photo: {
        file_id?: string
        file_unique_id: string
        file_size: number
        width: number
        height: number
    }[]
    document: {
        file_name: string
        mime_type: string
        thumbnail: {
            file_id: string
            file_unique_id: string
            file_size: number
            width: number
            height: number
        }
        thumb: {
            file_id: string
            file_unique_id: string
            file_size: number
            width: number
            height: number
        }
        file_id: string
        file_unique_id: string
        file_size: number
    }
}

export type CTX = any & { message: ctxMessage }
