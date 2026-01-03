package it.unical.xpoll.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a user in the XPoll system.
 * Supports both local authentication (email/password) and OAuth (Google).
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String username;

    @Column
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessMode accessMode;

    @Column
    private LocalDateTime registrationDate;

    // Email reset
    @Column
    private String resetToken;

    @Column
    private LocalDateTime resetTokenExpiry;

    @Column(unique = true)
    private String googleId; // For OAuth users

    @PrePersist
    protected void onCreate() {
        registrationDate = LocalDateTime.now();
    }
}
