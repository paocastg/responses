import {
  IHttp,
  IModify,
  IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { createTagContextual } from '../lib/createTagContextual';
import { API } from '../API/api';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IApiRequest } from '@rocket.chat/apps-engine/definition/api/IRequest';

export class TagsCommand implements ISlashCommand {

  public command = 'response';
  public i18nParamsExample = '/response';
  public i18nDescription = 'responses editables';
  public providesPreview = false;

  constructor(private readonly app: App) { }

  public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
    const triggerId = context.getTriggerId() as string; // [1]
    const user = context.getSender();
    const api = new API(read, http);
    let tagList: any[] = [];
    

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

    const contextualbarBlocks = await createTagContextual(modify, tagList, null); // [2]

    await modify.getUiController().openContextualBarView(contextualbarBlocks, { triggerId }, user); // [3]

  }
}
