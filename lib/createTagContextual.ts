import {

  IModify
} from '@rocket.chat/apps-engine/definition/accessors';
import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';


export function createTagContextual(modify: IModify, taglist: any, roomId: any, visitorToken: any, visitorId: any): IUIKitContextualBarViewParam {
  const block = modify.getCreator().getBlockBuilder();

  block.addActionsBlock({
    blockId: 'listTags',
    elements: [
      block.newMultiStaticElement({
        placeholder: block.newPlainTextObject('seleccione una etiqueta'),
        actionId: 'changeTag',
        options: taglist.map((tag) => ({
          text: block.newPlainTextObject(tag.name),
          value: tag.name,
          visible: true,
        })),

      }),
    ],

  });

  return {
    id: roomId + "*" + visitorToken + "*" + visitorId,
    title: block.newPlainTextObject('Cierre de conversación'),
    submit: block.newButtonElement({
      text: block.newPlainTextObject('Cerrar'),
      style: ButtonStyle.DANGER,
    }),
    blocks: block.getBlocks(),

  };
}
