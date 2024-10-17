const { google } = require('googleapis');
const fs = require('fs').promises; // Certifique-se de que fs está importado corretamente


/**
 * Return profile user account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function getProfile(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.getProfile({ userId: 'me'});
  console.log(res.data);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.labels.list({
    userId: 'me',
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return;
  }
  console.log('Labels:');
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

/**
 * Lists e-mails.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export async function listEmails(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.messages.list({
     userId: 'me',
     maxResults: 10

    });
  console.log(res.data);
}

/**
 * Return e-mail payload.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param idMessage
 */
async function getMessagePayload(auth, idMessage) {
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.get({
    userId: 'me',
    id: idMessage,
  });
  return res.data.payload;
}

/**
 * Extract text message.
 *
 * @param parts Use payload.parts as a function argument
 */
function extractTextMessage(parts) {
  for (const part of parts) {
    if (part.mimeType === 'multipart/alternative' && part.parts) {
      for (const subPart of part.parts) {
        if (subPart.mimeType === 'text/plain') {
          const text = Buffer.from(subPart.body.data, 'base64').toString('utf-8');
          return text;
        }
      }
    }
  }
  return null;
}

module.exports = {
  getProfile,
  listLabels,
  listEmails, 
  getMessagePayload,
  extractTextMessage, 
};
