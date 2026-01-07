package it.unical.xpoll.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final OAuth2SuccessHandler oAuth2SuccessHandler;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http.cors(AbstractHttpConfigurer::disable) // CORS is handled by CorsConfig
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**",
                                                                "/api/auth/**",
                                                                "/api/public/**",
                                                                "/api/sessions/**",
                                                                "/ws/**")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                // Prevent redirect to OAuth for API calls - return 401 instead
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(401);
                                                        response.setContentType("application/json");
                                                        response.getWriter().write(
                                                                        "{\"error\":\"Unauthorized\",\"message\":\""
                                                                                        + authException.getMessage()
                                                                                        + "\"}");
                                                }))
                                .oauth2Login(oauth2 -> oauth2
                                                .successHandler(oAuth2SuccessHandler))
                                .addFilterBefore(jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
