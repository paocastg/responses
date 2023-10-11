import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom, IVisitor } from "@rocket.chat/apps-engine/definition/livechat";
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { Data, Option } from './interfaces/createModal';
import { IUIKitInteractionHandler, IUIKitResponse, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { TagsCommand } from './command/TagsCommand';
import  createTagContextual from './lib/createTagContextual';
import { API } from './API/api';
import { settings } from './config/Settings';
import { IApiRequest } from '@rocket.chat/apps-engine/definition/api';


export class ResponseEditableApp extends App  implements IUIKitInteractionHandler {
    public modalData: Partial<{ viewState: Data[]; visitor: IVisitor }>;
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
             
    }
    public setModalData(data: {}) {
        this.modalData = { ...this.modalData, ...data };
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(this.setModalData.bind(this));
        await Promise.all(
			settings.map((setting) =>
				configuration.settings.provideSetting(setting),
			),
		);
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence:IPersistence, modify: IModify): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const { actionId } = data;
        const api = new API(read, http);
        let responseList = Array<any>();
        let responseSeleccionado:any;
        let rid = data.container.id;
        let edit = false;

        try {
            const response = await api.TagList()
            
            if (response) {
                let content: any = response.content;
                if (content !== undefined) {
                    content = JSON.parse(content);
                    responseList = content.canned_responses; 
                }
            }
        } catch (err) {
            console.log(`Quickresponses editables [${rid}][executeBlockActionHandler] unexpected err`,err )
        }

        switch (actionId) {
            case 'changeTag': {    
                responseSeleccionado = responseList.find(x => x.text=== data.value);  
                const modal = await createTagContextual(modify, responseList, responseSeleccionado, rid, edit);
                await modify.getUiController().updateContextualBarView(modal, { triggerId: data.triggerId }, data.user);
                break; 
            }
            case 'edit': {    
                edit = true;
                const modal = await createTagContextual(modify, responseList, responseSeleccionado, rid, edit);
                await modify.getUiController().updateContextualBarView(modal, { triggerId: data.triggerId }, data.user);
            }
        }
        
        return {
            success: true,
        };
    }


    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp): Promise<IUIKitResponse>{
        const data = context.getInteractionData();

        const api = new API(read, http);

        const { state }: {
            state: {
                listTags: {
                    changeTag: string,
                }
                response:{
                    changeresponse: string
                }
            }
        } = data.view as any;


        try {
            await api.createMessage(state, data)
        } catch (err) {
            console.log("CreateMessage err", err)
        }

        return {
            success: true,
        };
    }
}
