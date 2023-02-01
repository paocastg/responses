import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from "@rocket.chat/apps-engine/definition/livechat";
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { IUIKitResponse, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { TagsCommand } from './command/TagsCommand';
import { createTagContextual } from './lib/createTagContextual';
import { API } from './API/api';
import { SettingId } from './config/Settings';


export class TagSelectRocketChatApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors, private read: IRead, private http: IHttp, private visitor: IVisitor) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new TagsCommand(this));
        configuration.settings.provideSetting({
            id: SettingId.XAuthToken,
            type: SettingType.STRING,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'X-Auth-Token',
        });
        configuration.settings.provideSetting({
            id: SettingId.XUserId,
            type: SettingType.STRING,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'X-User-Id',
        });
    }


    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, modify: IModify): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const { actionId } = data;
        const api = new API(read, http);
        var roomId: any;
        var visitorToken: any;
        var visitorId: any;

        switch (actionId) {
            case 'changeTag': {
                var taglist = Array<any>();
                let tagSeleccionado: any;
                try {
                    const response = await api.TagList()
                    tagSeleccionado = taglist.find(x => x.id === data.value);
                    if (response) {
                        let content: any = response.content;
                        if (content !== undefined) {
                            content = JSON.parse(content);
                            taglist = content.tags_list;
                        }
                    }

                } catch (err) {
                    console.log("TagList err", err)
                }

                const modal = await createTagContextual(modify, tagSeleccionado, roomId, visitorToken, visitorId);
                await modify.getUiController().updateContextualBarView(modal, { triggerId: data.triggerId }, data.user);

            }
        }
        return {
            success: true,
        };
    }


    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp): Promise<IUIKitResponse> {
        const data = context.getInteractionData()
        const api = new API(read, http);

        const { state }: {
            state: {
                listTags: {
                    changeTag: string,
                }
            }
        } = data.view as any;

        try {
            await api.CloseRoom(state, data)
        } catch (err) {
            console.log("CloseRoom err", err)
        }

        try {
            await api.UpdateTag(state, data)
        } catch (err) {
            console.log("UpdateTag err", err)
        }

        console.log("success tagclose");
        return context.getInteractionResponder().successResponse();
    }
}
