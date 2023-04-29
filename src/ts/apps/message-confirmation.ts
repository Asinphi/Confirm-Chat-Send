import {ChatMessageData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

import {ConfirmChatSend} from "../module";

let isPrompting: boolean = false;

function promptConfirmation(message: ChatMessageData) {
    isPrompting = true;
    let chatBox: HTMLTextAreaElement;
    if (document.hasFocus()) { // Make compatible with popouts
        chatBox = document.activeElement.id === "chat-message" ? document.activeElement as HTMLTextAreaElement : document.querySelector("#chat-message") as HTMLTextAreaElement;
    } else if (ui.sidebar.popouts.chat) {
        chatBox = ui.sidebar.popouts.chat.element.find("#chat-message")[0] as HTMLTextAreaElement;
    } else {
        chatBox = document.activeElement.id === "chat-message" ? document.activeElement as HTMLTextAreaElement : document.querySelector("#chat-message") as HTMLTextAreaElement;
    }
    const form = chatBox.parentElement;
    setTimeout(() => { chatBox.value = message.content; }, 1); // Allow user to preview their chat message
    const confirmationBox = document.createElement("div");
    confirmationBox.classList.add("send-confirmation");
    confirmationBox.innerHTML = `<span>Confirm message?</span><input type="button" value="Submit (ALT + S)" class="send-confirmation__submit"><input type="button" value="Cancel (ALT + C)" class="send-confirmation__cancel">`;
    /*
    If the form innerHTML is set directly, it'll replace the existing .chat-message box, which will remove the
    listeners that allow a message to send on enter key.
     */
    form.insertBefore(confirmationBox, chatBox);
    const submitButton = confirmationBox.querySelector(".send-confirmation__submit") as HTMLInputElement;
    const cancelButton = confirmationBox.querySelector(".send-confirmation__cancel") as HTMLInputElement;
    switch (game.settings.get(ConfirmChatSend.ID, "enter-key-behavior")) {
        case "cancel":
            cancelButton.focus();
            break;
        case "confirm":
            submitButton.focus();
            break;
        default:
            break;
    }

    let onConfirm: () => void;
    let onCancel: () => void;
    function onKeyDown(event: KeyboardEvent) { // Also confirm on ALT + S
        if (event.altKey)
            if (event.key === "s")
                onConfirm();
            else if (event.key === "c")
                onCancel();
    }
    onConfirm = () => {
        chatBox.focus(); // Focus the text box so they can continue typing
        confirmationBox.remove();
        form.removeEventListener("keydown", onKeyDown);

        chatBox.value = "";
        const now = Date.now()
        message.timestamp = now;
        message._source.timestamp = now; // Otherwise, it would use the old timestamp
        ConfirmChatSend.log("Message confirmed, sending message", message);
        ChatMessage.create(message).then(() => {
            isPrompting = false;
        });
        if (game.modules.get("reveal-typing")?.active)
            game.socket?.emit("module.reveal-typing", {userName: game.user.name, message: ""});
    }
    onCancel = () => {
        ConfirmChatSend.log("Message cancelled");
        confirmationBox.remove();
        form.removeEventListener("keydown", onKeyDown);

        chatBox.value = message.content;
        chatBox.focus();
        isPrompting = false;
    }
    form.addEventListener("keydown", onKeyDown);
    submitButton.addEventListener("click", onConfirm);
    cancelButton.addEventListener("click", onCancel);
}

Hooks.on("preCreateChatMessage", (message: ChatMessageData) => {
    if (!isPrompting && ConfirmChatSend.messageTypesToConfirm[message.type]) {
        ConfirmChatSend.log("Prompting confirmation for message", message, "is currently prompting:", isPrompting);
        promptConfirmation(message);
        return false;
    }
    return true;
});
