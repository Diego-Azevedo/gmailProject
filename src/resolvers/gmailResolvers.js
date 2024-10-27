const { google } = require('googleapis');
const fs = require('fs').promises;


async function getProfile(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.getProfile({ userId: 'me'});
  return console.log(res.data);
}

async function listLabels(auth) {
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
  return labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

async function listUnreadEmails(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.messages.list({
     userId: 'me',
     labelIds: ['UNREAD'],
     maxResults: 10

    });
  return res.data;
}

async function listEmails(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.messages.list({
     userId: 'me',
     maxResults: 10

    });
  return console.log(res.data);
}

async function getMessagePayload(auth, messageId) {
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });
  return res.data.payload;
}

function extractSubject(header) {
  for (const part of header) {
    if (part.name === 'Subject') {
      return part.value
    }
  }
  return null;
}

async function updateToRead(auth, messageId) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.messages.modify({
     userId: 'me',
     id: messageId,
     requestBody: {
      removeLabelIds: ['UNREAD']
    }
    });
  return res;
}

module.exports = {
  getProfile,
  listLabels,
  listEmails, 
  getMessagePayload,
  extractSubject,
  listUnreadEmails,
  updateToRead,
};
