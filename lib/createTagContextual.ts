import {

  IModify
} from '@rocket.chat/apps-engine/definition/accessors';
import { ButtonStyle, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';


export function createTagContextual(modify: IModify, taglist: any, responseSeleccionado:any, rid): IUIKitContextualBarViewParam {
  const block = modify.getCreator().getBlockBuilder();

  block.addActionsBlock({
    blockId: 'shortcut',
    elements: [
      block.newStaticSelectElement({
        placeholder: block.newPlainTextObject('Seleccione un quickresponse:'),
        actionId: 'changeTag',
        options: taglist.map((response) => ({
          text: block.newPlainTextObject(response.shortcut),
          value: response.text,
        }))
      }),
    ],
  });

  if(responseSeleccionado != undefined && responseSeleccionado != null){  

    const externalId = 'response'; // Identificador externo del bloque

    // Obtén el bloque que deseas eliminar
    const blockList = block.getBlocks();
    // Busca el bloque existente con el externalId y elimínalo
    const existingBlock = block.getBlocks().find((b) => b.blockId === externalId);
    if (existingBlock) {
      console.log("existingBlock",existingBlock);
    }


    block.addInputBlock({
      blockId: 'response',
      optional: false,
      element: block.newPlainTextInputElement({
        actionId: `changeresponse`,
        initialValue: responseSeleccionado.text,
        placeholder: {
          type: TextObjectType.PLAINTEXT,
          text: responseSeleccionado.text,
          emoji: true,
        } ,
        multiline: true,
      }),
      label: block.newPlainTextObject('QuickResponse Descripción: '),
    });

    console.log("blockList",blockList);
  }

  return {
    id: rid,
    title: block.newPlainTextObject('Quickresponses Editables'),
    submit: block.newButtonElement({
      text: block.newPlainTextObject('Enviar'),
      style: ButtonStyle.DANGER,
    }),
    close: block.newButtonElement({
      text: block.newPlainTextObject('Cerrar'),
    }),
    blocks: block.getBlocks(),

  };
}
