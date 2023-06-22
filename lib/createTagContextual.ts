import {

  IModify
} from '@rocket.chat/apps-engine/definition/accessors';
import { ButtonStyle, IPlainTextInputElement } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';


export function createTagContextual(modify: IModify, taglist: any, responseSeleccionado:any): IUIKitContextualBarViewParam {
  const block = modify.getCreator().getBlockBuilder();

  block.addActionsBlock({
    blockId: 'listTags',
    elements: [
      block.newStaticSelectElement({
        placeholder: block.newPlainTextObject('Seleccione un quickresponse:'),
        actionId: 'changeTag',
        initialValue: 'rocket.cat',
        options: taglist.map((response) => ({
          text: block.newPlainTextObject(response.shortcut),
          value: response.text,
        }))
      }),
    ],
  });

  if(responseSeleccionado != undefined && responseSeleccionado != null){
    console.log("seleccionado", responseSeleccionado.text)
    block.addInputBlock({
      blockId: 'response',
      optional: false,
      element: block.newPlainTextInputElement({
        actionId: `changeresponse`,
        initialValue: responseSeleccionado.text,  
        multiline: true,
      }),
      label: block.newPlainTextObject('QuickResponse Descripción:'),
  });
  }


  
  return {
    id: 'contextualbarId' ,
    title: block.newPlainTextObject('Quickresponses Editables'),
    submit: block.newButtonElement({
      text: block.newPlainTextObject('Enviar'),
      style: ButtonStyle.DANGER,
    }),
    blocks: block.getBlocks(),

  };
}
