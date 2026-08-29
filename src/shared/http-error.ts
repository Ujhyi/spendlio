export class HttpError extends Error {
    constructor (public statusCode: number, public errorLabel: string, message: string) {
        super(message);
    }
}

export const badRequest = (message: string) => new HttpError(400, 'BAD_REQUEST', message)
export const unauthorized = (message: string) => new HttpError(401, 'UNAUTHORIZED', message)
export const notFound = (message: string) => new HttpError(404, 'NOT_FOUND', message)
export const interalError = (message: string) => new HttpError(500, 'INTERNAL_SERVER_ERROR', message)
