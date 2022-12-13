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
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUIKitResponse, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom, RoomType } from  '@rocket.chat/apps-engine/definition/rooms'

class CreateUiModal implements ISlashCommand {

    public command = 'tagclose';
    public i18nParamsExample = 'tagselect';
    public i18nDescription = 'cierre de conversacion con etiquetas';
    public providesPreview = false;

    constructor(private readonly app: App) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
        const triggerId = context.getTriggerId() as string;
        const user = context.getSender()
        const room:any = context.getRoom();
        const roomId = context.getRoom().id;
        const roomName= room.visitor.token;

        /***Cargar lista de tags */
        let taglist : any[] = [];

        const response = await http.get('https://linktest.keos.co/webhook/taglistall');
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
    // console.log("🚀 ~ file: TagSelectRocketChatApp.ts ~ line 58 ~ createContextualBarBlocks ~ roomName", roomName)
    // console.log("🚀 ~ file: TagSelectRocketChatApp.ts ~ line 58 ~ createContextualBarBlocks ~ roomId", roomId)
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

    block.addDividerBlock();
    block.addDividerBlock();


    // if(tagSelect != null && tagSelect != undefined){
    //     block.addInputBlock({
    //         blockId: 'tagSelect',
    //         element:block.newPlainTextInputElement({
    //             actionId: 'tagSelect',
    //             placeholder: block.newPlainTextObject('etiqueta seleccionada'),
    //             initialValue: tagSelect,
    //         }),
    //         label: block.newPlainTextObject('Etiqueta seleccionada'),
    //     });
    // }


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
        await configuration.slashCommands.provideSlashCommand(
            new CreateUiModal(this),
        )
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext ,  http: IHttp, modify: IModify,  read: IRead) {

        const data = context.getInteractionData();
        const { actionId } = data;


        switch (actionId) {
            case 'changeTag': {
                try{
                    var taglist = Array<any>();
                    const response = await http.get('https://linktest.keos.co/webhook/taglistall');
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
    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, modify: IModify, read: IRead ): Promise<IUIKitResponse> {

        const data = context.getInteractionData()
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
        // console.log("🚀 ~ file: TagSelectRocketChatApp.ts ~ line 185 ~ TagSelectRocketChatApp ~ executeViewSubmitHandler ~ arrayData", arrayData)
        // console.log("idroom", arrayData[0])

        try {
            const https = require("https");
            const body = JSON.stringify({
                "rid": arrayData[0],
                "token": arrayData[1],
                "tags": state.listTags.changeTag,
            });

            const options = {
                hostname: 'linktest.keos.co',
                port: 443,
                path: '/webhook/api/rocketchat/db_CierreChat',
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8',
                }
            };

            let requestPost= https.request( options, (resp) => {
                let body:any;
                resp.on('data', (chunk:any) => body.push(chunk))
                resp.on('end', () => {
                const resString = Buffer.concat(body).toString()
                // console.log("respuesta", resString)
                })
            });

            requestPost.on("error", (err) => {
                console.log("Error99: " + err.message);
            });

            requestPost.write(body);
            requestPost.end();

        } catch (err) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: err,
            });
        }
        console.log("success", state);
        return {
            success: true,
        };



    }
}
