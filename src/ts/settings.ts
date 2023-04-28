import { moduleId } from "./constants";
import {ConfirmChatSend} from "./module";

export const registerSettings = () => {
    game.settings.register(moduleId, "enter-key-behavior", {
        name: game.i18n.localize("confirm-chat-send.settings.enter-key-behavior.name"),
        hint: game.i18n.localize("confirm-chat-send.settings.enter-key-behavior.hint"),
        scope: "client",
        config: true,
        type: String,
        choices: {
            "cancel": game.i18n.localize("confirm-chat-send.settings.enter-key-behavior.choices.cancel"),
            "confirm": game.i18n.localize("confirm-chat-send.settings.enter-key-behavior.choices.confirm"),
        } as never,
        default: "cancel",
    });

    for (const messageType in CONST.CHAT_MESSAGE_TYPES) {
        game.settings.register(moduleId, `confirm-${messageType}`, {
            name: game.i18n.localize(`confirm-chat-send.settings.confirm.${messageType.toLowerCase()}.name`),
            hint: game.i18n.localize(`confirm-chat-send.settings.confirm.${messageType.toLowerCase()}.hint`),
            scope: "client",
            config: true,
            type: Boolean,
            default: false,
            onChange: (value: boolean) => {
                // @ts-ignore
                ConfirmChatSend.messageTypesToConfirm[CONST.CHAT_MESSAGE_TYPES[messageType]] = value;
            }
        });
    }
}

export const loadSettings = () => {
    for (const messageType in CONST.CHAT_MESSAGE_TYPES) {
        // @ts-ignore
        ConfirmChatSend.messageTypesToConfirm[CONST.CHAT_MESSAGE_TYPES[messageType]] = game.settings.get(moduleId, `confirm-${messageType}`);
    }
}