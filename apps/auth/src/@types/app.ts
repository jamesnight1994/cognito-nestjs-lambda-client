export type AppClient = {
    client_id: string
    client_secret: string
}

export type VerifyAppClient = {
    token: string,
    userPoolId: string,
    tokenUse: 'access' | 'id',
    clientId: string
}
