import axios from 'axios';

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
    var spurl = `https://${process.env.SP_TENANT_NAME}.sharepoint.com/sites/${sitename}/_api/web/GetFolderByServerRelativeURL('/sites/${sitename}/Shared Documents/${folderPath}/')/Files/add(url='${filename}',overwrite=true)`;
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
  var spurl = `https://construsoftgroup.sharepoint.com/sites/${sitename}/_api/web/lists/GetByTitle('${listname}')/items'`;
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