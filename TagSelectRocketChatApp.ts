import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {ButtonStyle} from '@rocket.chat/apps-engine/definition/uikit';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUIKitResponse, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

class TagsCommand implements ISlashCommand {
    // this is what we will type when calling the slashcommand: /contextualbar
    public command = 'tagclose';
    public i18nParamsExample = 'tagselect';
    public i18nDescription = 'cierre de conversacion con etiquetas';
    public providesPreview = false;

    constructor(private readonly app: App) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify,http: IHttp): Promise<void> {
        const triggerId = context.getTriggerId() as string; // [1]
        const user = context.getSender();
        const settingsReader = read.getEnvironmentReader().getSettings();
        const list_api = await settingsReader.getValueById('tags_list_api');
        const room:any = context.getRoom();
        const roomId = context.getRoom().id;
        const roomName= room.visitor.token;

        let taglist : any[] = [];

        const response = await http.get(list_api);

        if(response){
            let  content: any = response.content;
            if (content !== undefined ) {
                content= JSON.parse(content);
                taglist = content.data.results;
            }
        }

        const contextualbarBlocks = await createTagContextual(modify, taglist,roomId, roomName); // [2]

        await modify.getUiController().openContextualBarView(contextualbarBlocks, { triggerId }, user); // [3]

    }
}

function createTagContextual(modify: IModify, taglist: any, roomId:any, roomName:any ): IUIKitContextualBarViewParam {
    const block= modify.getCreator().getBlockBuilder();

    block.addActionsBlock({
        blockId: 'listTags',
        elements: [
            block.newMultiStaticElement({
                placeholder: block.newPlainTextObject('seleccione una etiqueta'),
                actionId: 'changeTag' ,
                options: taglist.map((tag) => ({
                    text: block.newPlainTextObject(tag.tag),
                    value: tag.tag,

                })),

            }),
        ],

    });


    return { // [6]
        id: roomId + "*" + roomName,
        title: block.newPlainTextObject('Cierre de conversación'),
        submit: block.newButtonElement({
            text: block.newPlainTextObject('Cerrar'),
            style: ButtonStyle.DANGER,
        }),
        blocks: block.getBlocks(),
    };
}


export class TagSelectRocketChatApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new TagsCommand(this));
        configuration.settings.provideSetting({
            id: 'tags_list_api',
            type: SettingType.STRING,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'URL API TagsList',
        });
        configuration.settings.provideSetting({
            id: 'tags_close_api',
            type: SettingType.STRING,
            packageValue: '',
            required: true,
            public: false,
            i18nLabel: 'URL API TagsClose',
        });
    }


    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        const data = context.getInteractionData();
        const settingsReader = read.getEnvironmentReader().getSettings();
        const list_api = await settingsReader.getValueById('tags_list_api');
        const { actionId } = data;
        var roomId:any;
        var roomName:any;

        switch (actionId) {
            case 'changeTag': {

                var taglist = Array<any>();
                const response = await http.get(list_api);
                let tagSeleccionado = taglist.find(x => x.id === data.value);
                if(response){
                    let  content: any = response.content;
                    if (content !== undefined ) {
                        content= JSON.parse(content);
                        taglist = content.templates_info;
                    }
                }
                const modal = await createTagContextual (modify, tagSeleccionado, roomId, roomName );
                await modify.getUiController().updateContextualBarView(modal, { triggerId: data.triggerId }, data.user);

            }
        }
        return {
            success: true,
        };
    }

    // [10]
    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read:IRead, http:IHttp): Promise<IUIKitResponse> {
        const data = context.getInteractionData()
        const settingsReader = read.getEnvironmentReader().getSettings();
        const close_api = await settingsReader.getValueById('tags_close_api');


        // [11]
        const { state }: {
            state: {
                listTags: {
                    changeTag: string,
                    }
                }
            }
         = data.view as any;

        let arrayData : any[] = data.view.id.split("*");
        // se hace el llamado del webhook ingresado desde la configuracion de la app en rocketchat
        const response = await http.post(close_api, {
            headers: {
                'Content-Type': 'application/json',
                'charset': 'utf-8',
            },
            data: {
                'rid': arrayData[0],
                'token': arrayData[1],
                'tags': state.listTags.changeTag,
            },
        });

        if(response){
            let  content: any = response.content;
            if (content !== undefined ) {
                content= JSON.parse(content);

            }
        }

        console.log("success tagclose");
        return context.getInteractionResponder().successResponse();
    }
}
