/**
 * EnASCI - Dialogue System
 * Handles RPG-style typewriter text boxes, branching messages, and SFX.
 */

export class DialogueSystem {
    constructor(audio) {
        this.audio = audio;
        this.isActive = false;
        this.messages = [];
        this.currentIndex = 0;
        this.speaker = "";

        this.displayedText = "";
        this.fullText = "";
        this.charIndex = 0;
        this.isTyping = false;
        this.typeSpeed = 28; // ms per char
        this.typeTimer = null;

        this.onCompleteCallback = null;
    }

    start(dialogueData, onComplete = null) {
        this.isActive = true;
        this.speaker = dialogueData.speaker || "NPC";
        this.messages = dialogueData.messages || [];
        this.currentIndex = 0;
        this.onCompleteCallback = onComplete;
        this.showNextMessage();
    }

    showNextMessage() {
        if (this.currentIndex >= this.messages.length) {
            this.close();
            return;
        }

        this.fullText = this.messages[this.currentIndex];
        this.displayedText = "";
        this.charIndex = 0;
        this.isTyping = true;

        if (this.typeTimer) clearInterval(this.typeTimer);

        this.typeTimer = setInterval(() => {
            if (this.charIndex < this.fullText.length) {
                const char = this.fullText[this.charIndex];
                this.displayedText += char;
                this.charIndex++;
                if (char !== ' ' && this.audio) {
                    this.audio.playDialogueBlip(520);
                }
            } else {
                this.isTyping = false;
                clearInterval(this.typeTimer);
                this.typeTimer = null;
            }
        }, this.typeSpeed);
    }

    advance() {
        if (!this.isActive) return;

        if (this.isTyping) {
            // Instant finish typing
            clearInterval(this.typeTimer);
            this.typeTimer = null;
            this.displayedText = this.fullText;
            this.isTyping = false;
        } else {
            // Go to next message
            this.currentIndex++;
            this.showNextMessage();
        }
    }

    close() {
        this.isActive = false;
        if (this.typeTimer) clearInterval(this.typeTimer);
        this.typeTimer = null;
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }
}
