package it.unical.xpoll.service;

import it.unical.xpoll.dto.AuthResponseDto;
import it.unical.xpoll.dto.LoginRequestDto;
import it.unical.xpoll.dto.RegisterRequestDto;
import it.unical.xpoll.dto.UserResponse;
import it.unical.xpoll.model.AccessMode;
import it.unical.xpoll.model.User;
import it.unical.xpoll.repository.UserRepository;
import it.unical.xpoll.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated())
            return Optional.empty();

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user)
            return Optional.of(user);

        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public AuthResponseDto register(RegisterRequestDto request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAccessMode(AccessMode.LOCAL);
        user.setRegistrationDate(LocalDateTime.now());

        userRepository.save(user);

        String token = tokenProvider.returnValidationToken(user);
        return AuthResponseDto.builder()
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    public AuthResponseDto login(LoginRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = tokenProvider.returnValidationToken(user);
        return AuthResponseDto.builder()
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accessMode(user.getAccessMode().name())
                .build();
    }

    /**
     * Request password reset - implements validateEmail(), generateRecoveryToken(),
     * requestEmailDispatch()
     */
    public void requestPasswordReset(String email) {
        // validateEmail(email)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // generateRecoveryToken()
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1)); // Token expires in 1 hour

        userRepository.save(user);

        // requestEmailDispatch(email, token) -> sendEmailWithCode(code)
        emailService.sendPasswordResetEmail(email, token);
    }

    /**
     * Reset password with token - implements validateCode(), updatePassword()
     */
    public void resetPassword(String token, String newPassword) {
        // validateCode(code)
        User user = userRepository.findAll().stream().filter(u -> token.equals(u.getResetToken())).findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        // Check if token is expired
        if (user.getResetTokenExpiry() == null || LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
            throw new RuntimeException("Reset token has expired");
        }

        // updatePassword(email, newPassword)
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);
    }
}
