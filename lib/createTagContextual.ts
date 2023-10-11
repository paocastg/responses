import {

  IModify
} from '@rocket.chat/apps-engine/definition/accessors';
import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { CreateModal } from '../interfaces/createModal'
import { uuid } from "./uuid";

export default async function createTagContextual({modify, taglist, responseSeleccionado,data,id = uuid(),}:CreateModal): Promise <IUIKitContextualBarViewParam> {
  const block = modify.getCreator().getBlockBuilder();

  for (const blockData of data) {
    switch (blockData.blockType) {
      case "input":
        block.addInputBlock({
            blockId: blockData.blockId,
            optional: blockData.optional || true,
            element: block.newPlainTextInputElement({
                actionId: blockData.actioId,
                multiline: blockData.multiline || false,
                initialValue: blockData.initialValue,
            }),
            label: block.newPlainTextObject(
                `${blockData.label}: ${
                    blockData.optional === false ? "*" : ""
                }`
            ),
        });
        break;
      }
    }  

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


    block.addContextBlock({
      blockId: 'descripcionText',
      elements: [
          block.newMarkdownTextObject('DESCRIPCIÓN: '+responseSeleccionado.text),
      ],
    });

    block.addInputBlock({
      blockId: 'response',
      element: block.newPlainTextInputElement({
        actionId: 'changeresponse',
        initialValue: responseSeleccionado.text,
        placeholder: block.newPlainTextObject('Escriba su respuesta'),
        multiline: true,
      }),
      label: block.newPlainTextObject('Editar respuesta'),
    });

  }


 
  return {
    id,
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
