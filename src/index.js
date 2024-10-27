const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const { getMessagePayload, extractSubject, listUnreadEmails, updateToRead } = require('./resolvers/gmailResolvers');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


async function main() {
  console.log('Iniciando a busca por novas mensagens...');
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });
  
  const unreadMessages = await listUnreadEmails(auth);

  if (unreadMessages.resultSizeEstimate > 0) {

    for (const message of unreadMessages.messages) {
      const messagePayload = await getMessagePayload(auth, message.id);
      const textMessage = extractSubject(messagePayload.headers);
      console.log('Text Message:', textMessage);

      for (const part of messagePayload.parts) {
        if (part.mimeType.startsWith('image/')) {
          const attachmentId = part.body.attachmentId;
          const filename = (message.id + part.filename);
          
          const attachmentRes = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: attachmentId,
            id: attachmentId
          });
    
          // Decodifica o conteúdo do anexo de Base64url
          const base64Data = attachmentRes.data.data;
          const decodedData = Buffer.from(base64Data, 'base64').toString('binary');
          // Save the attachment locally
          await fs.writeFile(`./${filename}`, decodedData, 'binary');
          console.log(`Download - ${filename} salvo com suecesso`);
        }
      }
      await updateToRead(auth, message.id)
      console.log('Dados salvos, mensagem marcada como lida.');
      console.log('');
    }
  } else {
    console.log('Nenhuma nova mensagem encontrada. Nova busca em 10 segundos.');
    console.log('');
  }
}

authorize().then(setInterval(main, 10000)).catch(console.error);