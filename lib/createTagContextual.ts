
import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitContextualBarViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { CreateModal } from '../interfaces/createModal'
import { uuid } from "./uuid";

export default async function createTagContextual({
  modify,
  data,
  id = uuid(),
}: CreateModal): Promise <IUIKitContextualBarViewParam> {

  const block = modify.getCreator().getBlockBuilder();

  for (const blockData of data) {
        switch (blockData.blockType) {
            case "action":
                block.addActionsBlock({
                    blockId: blockData.blockId,
                    elements: [
                        block.newStaticSelectElement({
                            actionId: blockData.actioId,
                            placeholder: block.newPlainTextObject(
                                `${blockData.placeholder}: ${
                                    blockData.optional === false ? "*" : ""
                                }`
                            ),
                            options: blockData.options?.map((option) => ({
                                text: block.newPlainTextObject(option.text),
                                value: option.value,
                            })),
                            initialValue: blockData.initialValue,
                        }),
                    ],
                });

                break;

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
            case "section":
                block.addSectionBlock({
                    blockId: blockData.blockId,
                    text: block.newMarkdownTextObject(blockData.label!),
                });
                break;
            default:
                break;
        }
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
