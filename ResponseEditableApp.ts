import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';

import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { Data } from './interfaces/createModal';
import { IUIKitInteractionHandler, IUIKitResponse, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { TagsCommand } from './command/TagsCommand';
import  createTagContextual from './lib/createTagContextual';
import { API } from './API/api';
import { settings } from './config/Settings';



export class ResponseEditableApp extends App  implements IUIKitInteractionHandler {
    public modalData: Partial<{ viewState: Data[]}>;
    public responsesValue: any[] = [];

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
             
    }
    public setModalData(data: {}) {
        this.modalData = { ...this.modalData, ...data };
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(
            new TagsCommand(this, this.setModalData.bind(this))
        );

        await Promise.all(
			settings.map((setting) =>
				configuration.settings.provideSetting(setting),
			),
		);
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence:IPersistence, modify: IModify): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const value = JSON.parse(data.value!);
        let modalDs: Data[] = this.modalData.viewState!;


        const api = new API(read, http);
        let responseList = Array<any>();

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
            console.log(`Quickresponses editables [][executeBlockActionHandler] unexpected err`,err )
        }

        // check if it's last service level to get service aggreement
        if (/services/.test(data.blockId)) {
            if (!Array.isArray(value)) {
                let md: Data[] = [];
                for (let i = 0; i < modalDs.length; i++) {
                    let mData = modalDs[i];

                    if (mData.blockId === "SLA") {
                        const isServiceID = Number(
                            this.responsesValue[this.responsesValue.length - 1]
                        );

                        if (isServiceID) {
                            const slaData = await req.getSLAlist(isServiceID);

                            const sla: Option[] = mapOptions(
                                Array.from(slaData.SLAList),
                                "Title",
                                "ID"
                            );

                            mData = { ...mData, options: sla };
                        }
                    }

                    md = [...md, mData];
                }
                modalDs = md;
            }
        }

        const modal = await createTagContextual({
            modify,
            data: modalDs,
            id: data.container.id,
        });

        modify.getUiController().updateModalView(
            modal,
            {
                triggerId: data.triggerId,
            },
            data.user
        );

        this.setModalData({ viewState: modalDs });
        return {
            success: true,
        };
    }


    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp): Promise<IUIKitResponse>{
        const data = context.getInteractionData();

        const api = new API(read, http);

        const { state }: {
            state: {
                shortcut: {
                    changeResponse: string,
                }
                response:{
                    changeresponse: string
                }
            }
        } = data.view as any;

//sending the message to the conversation
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
