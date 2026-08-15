const AppError = require("../../../errors/AppError");

async function getEmailByGoogleToken(google_token) {
    if(!google_token) throw new AppError({ message: "Google token is required for this operation" })

    const google_result = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
            headers: {
                Authorization: `Bearer ${google_token}`
            }
        }
    );

    if(google_result.status === 401) { 
        return null
    }

    const google_data = await google_result.json()
    const userEmail = google_data.email

    return userEmail
}

module.exports = {
    getEmailByGoogleToken
}