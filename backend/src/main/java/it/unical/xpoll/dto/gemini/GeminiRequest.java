package it.unical.xpoll.dto.gemini;

import java.util.List;

public record GeminiRequest(List<Content> contents) {

    public record Content(List<Part> parts, String role) {
        public static Content fromUserMessage(String message) {
            return new Content(List.of(new Part(message)), "user");
        }

        public static Content fromAssistantMessage(String message) {
            return new Content(List.of(new Part(message)), "model");
        }
    }

    public record Part(String text) {
    }
}