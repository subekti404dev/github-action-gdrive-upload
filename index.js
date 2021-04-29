const core = require("@actions/core");
const github = require("@actions/github");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

async function uploadFile(drive, filePath, filename) {
  try {
    const mimeType = mime.lookup(filePath);
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType,
      },
      media: {
        mimeType,
        body: fs.createReadStream(filePath),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function generatePublicUrl(drive, fileId) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    const result = await drive.files.get({
      fileId,
      fields: "webViewLink, webContentLink",
    });
    return result.data;
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    const CLIENT_ID = core.getInput("client-id");
    const CLIENT_SECRET = core.getInput("client-secret");
    const REDIRECT_URI = core.getInput("redirect-uri");

    const REFRESH_TOKEN = core.getInput("refresh-token");
    const FILE = core.getInput("file-to-upload");
    const FILENAME = core.getInput("filename");

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // upload
    const uploadedFile = await uploadFile(drive, FILE, FILENAME);
    const result = await generatePublicUrl(drive, uploadedFile.id);
    core.setOutput("web-view-link", result.webViewLink);
    core.setOutput("web-content-link", result.webContentLink);
    console.log({ result });
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
