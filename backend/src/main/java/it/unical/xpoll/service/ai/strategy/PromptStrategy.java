package it.unical.xpoll.service.ai.strategy;

public interface PromptStrategy {
    String buildPrompt(String input);

    String getSystemInstruction();

    default int getTimeoutSeconds() {
        return 30;
    }
}
