package it.unical.xpoll.controller;

import it.unical.xpoll.dto.*;
import it.unical.xpoll.model.User;
import it.unical.xpoll.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

//Controller for user profile management
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    // Gets current user profile with all details
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return userService.getCurrentUser()
                .map(user -> ResponseEntity.ok(toFullUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Updates current user's username.
    @PutMapping("/me/username")
    public ResponseEntity<?> updateUsername(@Valid @RequestBody UpdateUsernameRequest request) {
        try {
            User updatedUser = userService.updateUsername(request.getUsername());
            return ResponseEntity.ok(toFullUserResponse(updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Change current user's password (LOCAL users only).
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Get participation history for current user.
    @GetMapping("/me/participations")
    public ResponseEntity<List<ParticipationResponse>> getParticipations() {
        return userService.getCurrentUser()
                .map(user -> ResponseEntity.ok(userService.getUserParticipations(user.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    private UserResponse toFullUserResponse(User user) {
        return UserResponse.builder().id(user.getId()).email(user.getEmail()).username(user.getUsername())
                .accessMode(user.getAccessMode().name()).registrationDate(user.getRegistrationDate()).build();
    }
}
