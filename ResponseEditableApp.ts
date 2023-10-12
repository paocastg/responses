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
        const value = data.value!;
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

        if (/shortcut/.test(data.blockId)) {
            let newViewState: Data[] = [];
            for (let i = 0; i < this.modalData.viewState!.length; i++) {
                const block = this.modalData.viewState![i];
                if(/descripcionText/.test(block.blockId)){
                    const newBlockData: Data = {
                        blockId: `descripcionText-${Date.now()}`,
                        blockType: "section",
                        elementType: "text",
                        label: `DESCRIPCIÓN: ${data.value}`,
                    };

                    newViewState.push(newBlockData);
                    continue;
                }
                if (/response/.test(block.blockId)) {

                    const newBlockData: Data = {
                        blockId: `response-${Date.now()}`,
                        actioId: `changeresponse-${Date.now()}`,
                        blockType: "input",
                        elementType: "text",
                        label: "Editar respuesta",
                        multiline: true,
                        optional: false,
                        initialValue: data.value,
                    };

                    newViewState.push(newBlockData);
                    continue;
                }

                newViewState.push(block);
            }

            modalDs = newViewState;
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
        this.getLogger().debug(data.view.state, " all the state ");
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
