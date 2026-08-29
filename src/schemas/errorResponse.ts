export const badRequestResponseSchema = {
    $id: "badRequestResponse",
    type: "object",
    properties: {
        statusCode: { type: 'number', const: 400},
        error: { type: 'string'}
    }
}