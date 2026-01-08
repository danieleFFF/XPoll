package it.unical.xpoll.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/* 
 * Send the email using the JavaMailSender 
 * 
 *    |\__/,|   (`\ 
 *  _.|o o  |_   ) )
 * -(((---(((-------- Pippi
 * (Daniele, maybe the style for the email is to much?)
 */
@Service
public class EmailService {
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        if (mailSender == null)
            return;

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("XPoll - Password Reset Request");

            String htmlContent = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #203452; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { display: inline-block; padding: 12px 30px; background-color: #203452; color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; }
                            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>XPoll</h1>
                            </div>
                            <div class="content">
                                <h2>Password Reset Request</h2>
                                <p>You have requested to reset your password. Click the button below to reset your password:</p>
                                <p style="text-align: center;">
                                    <a href="%s" class="button">Reset Password</a>
                                </p>
                                <p>Or copy and paste this link into your browser:</p>
                                <p style="word-break: break-all; background-color: #e9e9e9; padding: 10px; border-radius: 4px;">%s</p>
                                <p><strong>This link will expire in 1 hour.</strong></p>
                                <p>If you did not request a password reset, please ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2026 XPoll. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(resetLink, resetLink);

            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
}
