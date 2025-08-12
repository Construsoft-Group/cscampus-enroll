import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export async function getSpAccessToken() {
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("client_id", `${process.env.SP_CLIENT_ID}@${process.env.SP_TENANT_ID}`);
    formData.append("client_secret", process.env.SP_CLIENT_SECRET);
    formData.append("resource", `00000003-0000-0ff1-ce00-000000000000/${process.env.SP_TENANT_NAME}.sharepoint.com@${process.env.SP_TENANT_ID}`);
    formData.append("refresh_token", process.env.SP_REFRESHTOKEN);
    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://accounts.accesscontrol.windows.net/${process.env.SP_TENANT_ID}/tokens/OAuth/2`,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data : formData
      };
      let res = await axios(config)
      return res;
}

export async function sendFileToSp(file, filename, spAccessToken, sitename, folderPath) {
    var spurl = `https://${process.env.SP_TENANT_NAME}.sharepoint.com/sites/${sitename}/_api/web/GetFolderByServerRelativeURL('/sites/${sitename}/${folderPath}/')/Files/add(url='${filename}',overwrite=true)`;
    var config = {
        method: 'post',
        url: spurl,
        headers: {
            'Authorization': `Bearer ${spAccessToken}`,
            'X-RequestDigest': '', 
            'Accept': 'application/json; odata=nometadata', 
            'Content-Type': 'application/pdf'
        },
        data : file
      };

    let res = await axios(config)
    return res;
}

export async function createListItem(spAccessToken, data, sitename, listname) {
  var spurl = `https://${process.env.SP_TENANT_NAME}.sharepoint.com/sites/${sitename}/_api/web/lists/GetByTitle('${listname}')/items'`;
  var config = {
      method: 'post',
      url: spurl,
      headers: {
          'Authorization': `Bearer ${spAccessToken}`,
          'X-RequestDigest': '', 
          'Accept': 'application/json; odata=nometadata', 
          'Content-Type': 'application/json; odata=verbose'
      },
      data : data
    };

  let res = await axios(config)
  return res;
}

export async function sendFilePAutomate(filepath, fileName) {
  const form = new FormData();
  form.append('apiKey', 'Wvoi81VtkgP5');
  form.append('fileName', fileName);
  form.append('fileContent', fs.createReadStream(filepath));

  const res = await axios.post(
    'https://prod-160.westeurope.logic.azure.com:443/workflows/xxx/triggers/manual/paths/invoke?...',
    form,
    { headers: form.getHeaders(), maxBodyLength: Infinity }
  );

  return res;

  /*
  return axios.post(
    'https://prod-160.westeurope.logic.azure.com:443/workflows/3c1d2de3f0b3427bb6435e6a89ece663/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WbC3eev_TDqZWmaGO2C4LJzHHyqJYqeR-kVgUT95XMY',
    {
      apiKey: "Wvoi81VtkgP5",
      fileName: fileName,
      fileContent: base64Content
    },
    {
      headers: { 'Content-Type': 'application/json' },
      maxBodyLength: Infinity
    }
  );
  */
}