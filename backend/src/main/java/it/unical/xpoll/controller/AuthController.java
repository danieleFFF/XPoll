package it.unical.xpoll.controller;

import it.unical.xpoll.dto.PasswordResetDto;
import it.unical.xpoll.dto.PasswordResetRequestDto;
import it.unical.xpoll.dto.UserResponse;
import it.unical.xpoll.model.User;
import it.unical.xpoll.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return userService.getCurrentUser().map(user -> ResponseEntity.ok(toUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody it.unical.xpoll.dto.RegisterRequestDto request) {
        try {
            return ResponseEntity.ok(userService.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody it.unical.xpoll.dto.LoginRequestDto request) {
        try {
            return ResponseEntity.ok(userService.login(request));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Request password reset - sends reset email with token
     */
    @PostMapping("/password-reset/request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDto request) {
        try {
            userService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "If the email exists, a password reset link has been sent"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "If the email exists, a password reset link has been sent"));
        }
    }

    /**
     * Confirm password reset with token and new password
     */
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetDto request) {
        try {
            userService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password has been successfully reset"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder().id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessMode(user.getAccessMode().name())
                .build();
    }
}
