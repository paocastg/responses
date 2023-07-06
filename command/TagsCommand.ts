import {
  IHttp,
  IModify,
  IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandContext, SlashCommandPreviewItemType } from '@rocket.chat/apps-engine/definition/slashcommands';

import { createTagContextual } from '../lib/createTagContextual';
import { API } from '../API/api';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SettingId } from '../config/Settings';


export class TagsCommand implements ISlashCommand {

  public command = 'response';
  public i18nParamsExample = '/qr';
  public i18nDescription = 'responses editables';
  public providesPreview = true;

  constructor(private readonly app: App) { }

  public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
    const triggerId = context.getTriggerId() as string; // [1]
    const user = context.getSender();
    const api = new API(read, http);
    let tagList: any[] = [];
    const rid = context.getRoom().id;

    const settingsReader = read.getEnvironmentReader().getSettings();
    const xUserId = await settingsReader.getValueById('x_user_id');
    const xAuthToken = await settingsReader.getValueById('x_auth_token');

    const baseurl = await api.getUrlbase();

    const apiURL = `${baseurl}/api/v1/canned-responses.list`;
    const { value: HideEditionQuickResponses } = await read
				.getEnvironmentReader()
				.getSettings()
				.getById(SettingId.HideEditionQuickResponses);
			
    const command = context.getArguments();
    
    try {
      const response = await api.TagList()

      if (response) {
        let content: any = response.content;
        if (content !== undefined) {
          content = JSON.parse(content);
          tagList = content.canned_responses;

        }
      }

    } catch (err) {
      console.log("TagList err", err)
    }

    if (HideEditionQuickResponses) {
      if (command.length === 0 || command[0] === '') {
        const contextualbarBlocks = await createTagContextual(modify, tagList, null, rid); 
        return await modify.getUiController().openContextualBarView(contextualbarBlocks, { triggerId }, user); 
      } 
    }

    if (command[0] === 'list') {
      return this.processListCommand(context, read, modify, http);
    }

    const message = await modify.getCreator().startMessage();
    const sender = await read.getUserReader().getByUsername(context.getSender().username);

    const room = await read.getRoomReader().getById(context.getRoom().id);

    const roomEph = context.getRoom();

    if (!room) {
        throw Error('No room is configured for the message');
    }
    message.setRoom(room);
    message.setSender(sender);

    const key = command.join(' ');

    try {
      const result = await http.get(`${apiURL}?key=${key}`
          , {
              headers: {
                  'X-User-Id': xUserId,
                  'X-Auth-Token': xAuthToken,
              },
          });

      let content: any = result.content;

      if (content !== undefined) {
          content = JSON.parse(content);
      }
      if (content.success === true && content.canned_responses.length > 0) {
          const response = result.data.results[0];
          if (!response) {
              throw new Error('No response found.');
          }
          message.setText(response.message);
          modify.getCreator().finish(message);
      } else {
          throw new Error('Could not get a response.');
      }
    } catch (error) {
      const rocketSender = await read.getUserReader().getById('rocket.cat');
      message.setSender(rocketSender);
      message.setRoom(roomEph);
      message.setText(error.message);
      modify.getNotifier().notifyRoom(roomEph, message.getMessage());
    }
  }
  public async previewer(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<ISlashCommandPreview> {
    const triggerId = context.getTriggerId() as string; // [1]
    const user = context.getSender();
    const data = {
        room: (context.getRoom() as any),
    };
    const settingsReader = read.getEnvironmentReader().getSettings();
    const token = await settingsReader.getValueById('x_auth_token');
    const id = await settingsReader.getValueById('x_user_id');
    const agente = context.getSender().username;
    const client = context.getRoom().displayName;
    const api = new API(read, http);
    const command = context.getArguments();
    const rid = context.getRoom().id

    if (command[0] === 'list') {
        return {
            i18nTitle: 'qr_command_preview',
            items: [{
                id: 'list',
                type: SlashCommandPreviewItemType.TEXT,
                value: 'List all keys.',
            }],
        };
    }

    const baseurl = await api.getUrlbase();
    const apiURL = `${baseurl}/api/v1/canned-responses.list`;

    const key = command.join(' ').toLowerCase();

    try {
        let result = await http.get(`${apiURL}?key=${key}`
            , {
                headers: {
                    'X-User-Id': id,
                    'X-Auth-Token': token,
                },
            });
        let content: any = result.content;
        if (content !== undefined) {
            content = JSON.parse(content);
        }
        if (content.success === true) {

            let filteredResponses = content.canned_responses.filter(response => response.shortcut.includes(key));

            return {
                i18nTitle: 'qr_command_preview',
                items: filteredResponses.map((result) => {
                    if (client && result.text.includes("{cliente}")) {
                        result.text = result.text.replace("{cliente}", client);
                    }
                    if (agente && result.text.includes("{agente}")) {
                        result.text = result.text.replace("{agente}", agente);
                    }
                    return {
                        id: result.shortcut,
                        type: SlashCommandPreviewItemType.TEXT,
                        value: result.text,
                    };
                }),
            };
        } else {
            throw new Error('No se pudo obtener una respuesta.');
        }
    } catch (error) {
        console.log(error.message);
    }
    return {
        i18nTitle: 'qr_command_preview',
        items: [],
    };
}

public async executePreviewItem(item: ISlashCommandPreviewItem, context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {

    if (item.id === 'list') {
        return this.processListCommand(context, read, modify, http);
    }

    const message = await modify.getCreator().startMessage();
    const sender = await read.getUserReader().getByUsername(context.getSender().username);
    const room = await read.getRoomReader().getById(context.getRoom().id);

    if (!room) {
        throw Error('No room is configured for the message');
    }

    message.setRoom(room);
    message.setSender(sender);

    message.setText(item.value);
    modify.getCreator().finish(message);
}



public async processListCommand(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
    const settingsReader = read.getEnvironmentReader().getSettings();
    const token = await settingsReader.getValueById('x_auth_token');
    const id = await settingsReader.getValueById('x_user_id');
    const message = await modify.getCreator().startMessage();
    const api = new API(read, http);
    const sender = await read.getUserReader().getById('rocket.cat');
    const roomEph = context.getRoom();

    message.setSender(sender);
    message.setRoom(roomEph);

    let text = 'QuickResponses disponibles:\n';

    const baseurl = await api.getUrlbase();
    const apiURL = `${baseurl}/api/v1/canned-responses.list`;

    const result = await http.get(`${apiURL}`
        , {
            headers: {
                'X-User-Id': id,
                'X-Auth-Token': token,
            },
        });

    let content: any = result.content;
    if (content !== undefined) {
        content = JSON.parse(content);
    }
    if (content.success === true) {
        console.log("content", content.canned_responses)
        let count = 0;
        content.canned_responses.forEach((response) => {

            if (count !== 0) {
                text += ', ';
            }
            text += response.shortcut;
            count++;
        });
    }

    message.setText(text);
    modify.getNotifier().notifyRoom(roomEph, message.getMessage());
}

}
