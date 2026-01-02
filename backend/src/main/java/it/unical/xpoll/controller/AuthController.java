package it.unical.xpoll.controller;

import it.unical.xpoll.dto.UserResponse;
import it.unical.xpoll.model.User;
import it.unical.xpoll.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder().id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessMode(user.getAccessMode().name())
                .build();
    }
}
