import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-docs',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Docs not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleDocsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.docs({ version: 'v1', auth: oauth2Client });
}

export async function createDocument(title: string, content: string): Promise<{ documentId: string; url: string }> {
  const docs = await getUncachableGoogleDocsClient();
  
  const createResponse = await docs.documents.create({
    requestBody: {
      title: title,
    },
  });
  
  const documentId = createResponse.data.documentId!;
  
  const requests: any[] = [];
  let index = 1;
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      requests.push({
        insertText: {
          location: { index },
          text: line.substring(2) + '\n',
        },
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: index, endIndex: index + line.length - 1 },
          paragraphStyle: { namedStyleType: 'HEADING_1' },
          fields: 'namedStyleType',
        },
      });
      index += line.length - 1;
    } else if (line.startsWith('## ')) {
      requests.push({
        insertText: {
          location: { index },
          text: line.substring(3) + '\n',
        },
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: index, endIndex: index + line.length - 2 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType',
        },
      });
      index += line.length - 2;
    } else if (line.startsWith('### ')) {
      requests.push({
        insertText: {
          location: { index },
          text: line.substring(4) + '\n',
        },
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: index, endIndex: index + line.length - 3 },
          paragraphStyle: { namedStyleType: 'HEADING_3' },
          fields: 'namedStyleType',
        },
      });
      index += line.length - 3;
    } else {
      requests.push({
        insertText: {
          location: { index },
          text: line + '\n',
        },
      });
      index += line.length + 1;
    }
  }
  
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    });
  }
  
  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}
