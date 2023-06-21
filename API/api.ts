import { IHttp, IHttpRequest, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingId } from "../config/Settings";

export class API {
  protected read: IRead;
  protected http: IHttp;


  public constructor(read: IRead, http: IHttp
  ) {
    this.read = read;
    this.http = http;

  }


  public getUrlbase(): Promise<string> {
    const serverURL = this.read
      .getEnvironmentReader()
      .getServerSettings()
      .getValueById('Site_Url');
    return serverURL;
  }

  public async TagList() {
    const settingsReader = this.read.getEnvironmentReader().getSettings();
    const RocketID = await settingsReader.getValueById(SettingId.XUserId)
    const RocketToken = await settingsReader.getValueById(SettingId.XAuthToken)
    let response: any = [];
    const baseurl = await this.getUrlbase();

    const url = `${baseurl}/api/v1/tags.list`; //${baseurl}/api/v1/livechat/visitor

    const headers = {
      'Content-Type': "application/json",
      'X-User-Id': RocketID,
      'X-Auth-Token': RocketToken,
    };

    const httpRequest: IHttpRequest = {
      headers: headers,
      strictSSL: false,
      timeout: 5000,
      rejectUnauthorized: false
    };
    console.log(`TagList url[${url}] | httpRequest `, httpRequest);
    response = await this.http.get(url, httpRequest);
    return response;
  }

  public async UpdateTag(state, data) {
    const settingsReader = this.read.getEnvironmentReader().getSettings();
    const RocketID = await settingsReader.getValueById(SettingId.XUserId)
    const RocketToken = await settingsReader.getValueById(SettingId.XAuthToken)

    const baseurl = await this.getUrlbase();
    const url = `${baseurl}/api/v1/livechat/room.saveInfo`; //${baseurl}/api/v1/livechat/visitor

    let arrayData: any[] = data.view.id.split("*");

    let guestData = {
      "_id": arrayData[2],
    }
    let roomData = {
      "_id": arrayData[0],
      "tags": state.listTags.changeTag
    }


    const headers = {
      'Content-Type': "application/json",
      'X-User-Id': RocketID,
      'X-Auth-Token': RocketToken,
    };
    const body: any = {
      "guestData": guestData,
      "roomData": roomData
    }


    const httpRequest: IHttpRequest = {
      content: JSON.stringify(body),
      data: body,
      params: body,
      headers: headers,
      strictSSL: false,
      timeout: 5000,
      rejectUnauthorized: false
    };
    console.log(`UpdateTag url[${url}] | httpRequest `, httpRequest);
    try {

      this.http.post(url, httpRequest).then((onfulfilled) => {
        console.log(`UpdateTag httpResponse onfulfilled `, onfulfilled);
      }, (onrejected) => {
        console.log(`UpdateTag httpResponse onrejected `, onrejected);
      });

      return true;
    } catch (error) {
      console.log(`UpdateTag unexpected err `, error);
    }
    return 0;
  }

}
