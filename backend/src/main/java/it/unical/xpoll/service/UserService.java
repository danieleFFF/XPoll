package it.unical.xpoll.service;

import it.unical.xpoll.domain.Option;
import it.unical.xpoll.domain.Participant;
import it.unical.xpoll.domain.Vote;
import it.unical.xpoll.dto.AuthResponseDto;
import it.unical.xpoll.dto.LoginRequestDto;
import it.unical.xpoll.dto.ParticipationResponse;
import it.unical.xpoll.dto.RegisterRequestDto;
import it.unical.xpoll.dto.UserResponse;
import it.unical.xpoll.model.AccessMode;
import it.unical.xpoll.model.User;
import it.unical.xpoll.repository.ParticipantRepository;
import it.unical.xpoll.repository.UserRepository;
import it.unical.xpoll.repository.VoteRepository;
import it.unical.xpoll.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;
    private final VoteRepository voteRepository;
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
                .registrationDate(user.getRegistrationDate())
                .build();
    }

    // Update username for current user
    public User updateUsername(String newUsername) {
        User user = getCurrentUser().orElseThrow(() -> new RuntimeException("User not authenticated"));

        // Check if username is already taken by another user.
        Optional<User> existingUser = userRepository.findByUsername(newUsername);

        if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
            throw new RuntimeException("Username already taken");
        }

        user.setUsername(newUsername);

        return userRepository.save(user);
    }

    // Change password for LOCAL users only.
    public void changePassword(String currentPassword, String newPassword) {
        User user = getCurrentUser().orElseThrow(() -> new RuntimeException("User not authenticated"));

        // Only local users can change password.
        if (user.getAccessMode() != AccessMode.LOCAL) {
            throw new RuntimeException("Password change is only available for local accounts");
        }

        // Verifies current password.
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validates new password (min 6 chars, at least one letter and one number).
        if (newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        boolean hasLetter = newPassword.chars().anyMatch(Character::isLetter);
        boolean hasNumber = newPassword.chars().anyMatch(Character::isDigit);

        if (!hasLetter) {
            throw new RuntimeException("Password must contain at least one letter");
        }
        if (!hasNumber) {
            throw new RuntimeException("Password must contain at least one number");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Get participation history for a user.
    public List<ParticipationResponse> getUserParticipations(Long userId) {
        List<Participant> participations = participantRepository.findByUserId(userId);
        System.out.println("DEBUG getUserParticipations: userId=" + userId + ", found " + participations.size() + " participations");

        for(Participant p : participations){
            boolean hasSession = p.getSession() != null;
            boolean hasPoll = hasSession && p.getSession().getPoll() != null;
            String state = hasSession ? String.valueOf(p.getSession().getState()) : "null";
            List<Vote> votes = hasSession ? voteRepository.findBySessionIdAndParticipantId(p.getSession().getId(), p.getId())  : java.util.Collections.emptyList();
            System.out.println("DEBUG: Participant '" + p.getName() + "' - hasSession=" + hasSession + ", hasPoll=" + hasPoll + ", state=" + state + ", votes=" + votes.size());
        }

        return participations.stream()
                .filter(p -> p.getSession() != null && p.getSession().getPoll() != null)
                // Only includes participations where the poll actually ended (not just joined
                // lobby or in progress).
                .filter(p -> p.getSession().getState() == it.unical.xpoll.domain.SessionState.CLOSED)
                // Only includes if participant actually submitted votes or is the presenter.
                .filter(p -> {
                    boolean isPresenter = p.getUserId() != null &&
                            p.getSession().getCreatorUserId() != null &&
                            p.getUserId().equals(p.getSession().getCreatorUserId());

                    if (isPresenter)
                        return true;
                    // Checks if participant submitted any votes
                    List<Vote> votes = voteRepository.findBySessionIdAndParticipantId(p.getSession().getId(),
                            p.getId());
                    return !votes.isEmpty();
                })
                .map(p -> {
                    // Checks if this participant is the presenter .
                    boolean isPresenter = p.getUserId() != null &&
                            p.getSession().getCreatorUserId() != null &&
                            p.getUserId().equals(p.getSession().getCreatorUserId());
                    boolean hasVoted = voteRepository.existsBySessionIdAndParticipantId(p.getSession().getId(),
                            p.getId());

                    int score = 0;
                    Integer maxScore = 0;

                    if (hasVoted) {
                        score = calculateScore(p);
                        maxScore = calculateMaxScore(p.getSession().getPoll());
                    }

                    return ParticipationResponse.builder()
                            .sessionId(p.getSession().getId())
                            .pollTitle(p.getSession().getPoll().getTitle())
                            .participationDate(p.getJoinedAt())
                            .score(score)
                            .maxScore(maxScore)
                            .isPresenter(isPresenter)
                            .hasParticipated(hasVoted)
                            .completionTimeSeconds(p.getCompletionTimeSeconds())
                            .totalTimeSeconds(p.getSession().getPoll().getTimeLimit())
                            .build();
                })
                // Sorts by participation date descending .
                .sorted((a, b) -> b.getParticipationDate().compareTo(a.getParticipationDate()))
                .collect(Collectors.toList());
    }

    private Integer calculateMaxScore(it.unical.xpoll.domain.Poll poll) {
        int maxScore = 0;
        for (it.unical.xpoll.domain.Question q : poll.getQuestions()) {
            int questionMax = 0;

            boolean hasValues = q.getOptions().stream().anyMatch(o -> o.getValue() != null && o.getValue() > 0);

            if (hasValues) {
                if (q.getType() == it.unical.xpoll.domain.Question.QuestionType.MULTIPLE_CHOICE) {
                    questionMax = q.getOptions().stream()
                            .filter(o -> o.getValue() != null && o.getValue() > 0)
                            .mapToInt(it.unical.xpoll.domain.Option::getValue)
                            .sum();
                } else {
                    questionMax = q.getOptions().stream()
                            .filter(o -> o.getValue() != null && o.getValue() > 0)
                            .mapToInt(it.unical.xpoll.domain.Option::getValue)
                            .max().orElse(0);
                }
            } else {
                // Check if any option is marked as correct
                boolean hasCorrectAnswer = q.getOptions().stream()
                        .anyMatch(o -> o.getIsCorrect() != null && o.getIsCorrect());
                if (hasCorrectAnswer) {
                    questionMax = 1;
                }
            }
            maxScore += questionMax;
        }
        return maxScore;
    }

    // Calculate total score for a participant based on their votes.
    private int calculateScore(Participant participant) {
        List<Vote> votes = voteRepository.findBySessionIdAndParticipantId(participant.getSession().getId(),
                participant.getId());
        int totalScore = 0;

        for (Vote v : votes) {
            if (v.getOption() == null || v.getQuestion() == null) {
                continue;
            }

            // Checks if option has explicit value/score.
            if (v.getOption().getValue() != null && v.getOption().getValue() > 0) {
                totalScore += v.getOption().getValue();
                continue;
            }

            // Otherwise checks if this option is marked as correct.
            if (v.getOption().getIsCorrect() != null && v.getOption().getIsCorrect()) {
                totalScore += 1; // 1 point for correct answer.
            }
        }
        return totalScore;
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
