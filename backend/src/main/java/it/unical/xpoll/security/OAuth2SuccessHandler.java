package it.unical.xpoll.security;

import it.unical.xpoll.model.AccessMode;
import it.unical.xpoll.model.User;
import it.unical.xpoll.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        User user = findOrCreateUser(oAuth2User);

        // returnValidationToken()
        String token = tokenProvider.returnValidationToken(user);
        String redirectUrl = frontendUrl + "/oauth/callback?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private User findOrCreateUser(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");

        return userRepository.findByGoogleId(googleId).orElseGet(() -> userRepository.findByEmail(email)
                .map(existingUser -> {
                    existingUser.setGoogleId(googleId);
                    if (existingUser.getAccessMode() == AccessMode.LOCAL)
                        existingUser.setAccessMode(AccessMode.GOOGLE);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .username(name)
                            .googleId(googleId)
                            .accessMode(AccessMode.GOOGLE)
                            .build();
                    return userRepository.save(newUser);
                }));
    }
}
