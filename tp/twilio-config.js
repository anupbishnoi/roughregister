module.exports = {
    accountSid: process.env.TP_ACCOUNT_SID || '',
    authToken: process.env.TP_AUTH_TOKEN || '',
    phones: [
        process.env.TP_PHONES_1 || '',
        process.env.TP_PHONES_2 || ''
    ],
    from: process.env.TP_FROM || '',
    msg: process.env.TP_MSG || ''
};
