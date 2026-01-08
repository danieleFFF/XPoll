package it.unical.xpoll.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

//Websocket configuration for realtime session sync between server and clients
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        //Simple broker for /topic (broadcast) messages.
        registry.enableSimpleBroker("/topic");
        //prefix for client->server messages (like a vote)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        //initial Websocket endpoint for client to connect to
        registry.addEndpoint("/ws").
                // permits any origin
                        setAllowedOriginPatterns("*").
                //enables http fallback if websocket is not supported
                        withSockJS();
    }
}