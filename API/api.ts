import { IHttp, IHttpRequest, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { SettingId } from "../config/Settings";
import { IApiRequest, IApiResponse } from "@rocket.chat/apps-engine/definition/api";
import { ILivechatMessage, ILivechatRoom } from "@rocket.chat/apps-engine/definition/livechat";

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

    const url = `${baseurl}/api/v1/canned-responses.list`; //${baseurl}/api/v1/livechat/visitor

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
    console.log(`Quickresponses url[${url}] | httpRequest `, httpRequest);
    response = await this.http.get(url, httpRequest);
    return response;
  }

  public async createMessage(state: any, request: IApiRequest) {

    // const rid = request.content.session.slice(
    //   request.content.session.lastIndexOf('/') + 1,
    //   request.content.session.length,
    // );

    console.log("rid-------------------------", request)

    const settingsReader = this.read.getEnvironmentReader().getSettings();
    const RocketID = await settingsReader.getValueById(SettingId.XUserId)
    const RocketToken = await settingsReader.getValueById(SettingId.XAuthToken)

    const baseurl = await this.getUrlbase();
    const url_updatevisitor = `${baseurl}/api/v1/chat.sendMessage`; //${baseurl}/api/v1/livechat/visitor


    let mensaje = {
        "rid": 'KxWQ9hcWfJ7RsQ855',
        "msg": state.response.changeresponse,
    }

    const headers = {
        'Content-Type': "application/json",
        'X-User-Id': RocketID,
        'X-Auth-Token': RocketToken,
    };
    const body: any = {
        "message": mensaje,
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
    console.log(`CreateMessage url[${url_updatevisitor}] | httpRequest `, httpRequest);

    try {
        // const resultupdate = await this.post(url_updatevisitor, httpRequest);

        this.http.post(url_updatevisitor, httpRequest).then((onfulfilled) => {
            console.log(`CreateMessage httpResponse onfulfilled `, onfulfilled);
        }, (onrejected) => {
            console.log(`CreateMessage httpResponse onrejected `, onrejected);
        });
        return true;

    } catch (error) {
        console.log(`CreateMessage unexpected err `, error);
    }
    return 0;
  }

}
