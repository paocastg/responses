import { IModify } from "@rocket.chat/apps-engine/definition/accessors";

interface Option {
    text: string;
    value: any;
}
interface Data {
    blockId: string;
    blockType: "action" | "input" | "section";
    elementType: "select" | "text";
    actioId?: string;
    multiline?: boolean;
    label?: string;
    placeholder?: string;
    options?: Option[];
    initialValue?: any;
    optional?: boolean;
}

interface CreateModal {
    id?: string;
    modify: IModify;
    data: Data[];
}

export { CreateModal, Data, Option };