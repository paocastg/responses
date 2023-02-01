import {
  IHttp,
  IModify,
  IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { createTagContextual } from '../lib/createTagContextual';
import { API } from '../API/api';

export class TagsCommand implements ISlashCommand {
  // this is what we will type when calling the slashcommand: /contextualbar
  public command = 'tagclose';
  public i18nParamsExample = 'tagselect';
  public i18nDescription = 'cierre de conversacion con etiquetas';
  public providesPreview = false;

  constructor(private readonly app: App) { }

  public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
    const triggerId = context.getTriggerId() as string; // [1]
    const user = context.getSender();
    const room: any = context.getRoom();
    const roomId = context.getRoom().id;
    const visitorToken = room.visitor.token;
    const visitorId = room.visitor.id;

    const api = new API(read, http);
    let taglist: any[] = [];

    try {
      const response = await api.TagList()
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

    const contextualbarBlocks = await createTagContextual(modify, taglist, roomId, visitorToken, visitorId); // [2]

    await modify.getUiController().openContextualBarView(contextualbarBlocks, { triggerId }, user); // [3]

  }
}
