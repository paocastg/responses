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


class CreateUiModal implements ISlashCommand {

    public command = 'tagclose';
    public i18nParamsExample = 'tagselect';
    public i18nDescription = 'cierre de conversacion con etiquetas';
    public providesPreview = false;

    constructor(private readonly app: App) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
        const triggerId = context.getTriggerId() as string;
        const settingsReader = read.getEnvironmentReader().getSettings();
        const tags_list_api = await settingsReader.getValueById('tags_list_api');
        const user = context.getSender()
        const room:any = context.getRoom();
        const roomId = context.getRoom().id;
        const roomName= room.visitor.token;

        /***Cargar lista de tags */
        let taglist : any[] = [];

        const response = await http.get(tags_list_api);
        console.log("user", user)
        console.log("roomId", roomId)
        console.log("room",roomName)

        if(response){
            let  content: any = response.content;
            if (content !== undefined ) {
                content= JSON.parse(content);
                taglist = content.data.results;
            }
        }

        const contextualbarBlocks = await createContextualBarBlocks(modify, taglist, null,roomId, roomName , undefined); // [2]

        await modify.getUiController().openContextualBarView(contextualbarBlocks, { triggerId }, user); // [3]
    }
}

async function createContextualBarBlocks(modify:IModify, taglist: any, tagSelect:any, roomId:any, roomName:any , viewId?:string ): Promise<IUIKitContextualBarViewParam>{

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


    return {
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
        configuration.slashCommands.provideSlashCommand(new CreateUiModal(this));
        // se crean las variables de configuracion para el envio de mensajes
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
    public async executeBlockActionHandler(context: UIKitBlockInteractionContext ,  http: IHttp, modify: IModify,  read: IRead) {

        const data = context.getInteractionData();
        const settingsReader = read.getEnvironmentReader().getSettings();
        const tags_list_api = await settingsReader.getValueById('tags_list_api');
        const { actionId } = data;


        switch (actionId) {
            case 'changeTag': {
                try{
                    var taglist = Array<any>();
                    const response = await http.get(tags_list_api);
                    let tagSeleccionado = taglist.find(x => x.id === data.value);
                    if(response){
                        let  content: any = response.content;
                        if (content !== undefined ) {
                            content= JSON.parse(content);
                            taglist = content.templates_info;
                        }
                    }
                    const modal = await createContextualBarBlocks(modify,taglist, tagSeleccionado, "1122", "testando", undefined);
                    return context.getInteractionResponder().updateModalViewResponse(modal);

                } catch (err) {
                    console.error(err);
                    return {
                        success: false,
                    };
                }
            }
        }
        return {
            success: true,
        };
    }

    // [10]
    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, modify: IModify, http: IHttp, read: IRead ): Promise<IUIKitResponse> {

        const data = context.getInteractionData()
        const settingsReader = read.getEnvironmentReader().getSettings();
        const tags_close_api = await settingsReader.getValueById('tags_close_api');
        console.log("data", data)

        const { state }: {
            state: {
                listTags: {
                    changeTag: {
                        selected_option: {
                            value: string,
                        },
                    },
                }
            }
        } = data.view as any;

        let arrayData : any[] = data.view.id.split("*");

        const response = await http.post(tags_close_api, {
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
                console.log("content", content);
            }
        }
        console.log("success tagclose");
        return context.getInteractionResponder().successResponse();
    }
}
