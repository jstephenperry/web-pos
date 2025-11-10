package dev.jstephenperry.webpos.payment.repository;

import dev.jstephenperry.webpos.payment.model.PaymentToken;
import dev.jstephenperry.webpos.payment.model.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTokenRepository extends JpaRepository<PaymentToken, String> {

    Optional<PaymentToken> findByToken(String token);

    List<PaymentToken> findByCustomerIdAndStatus(String customerId, TokenStatus status);

    List<PaymentToken> findByCustomerId(String customerId);

    @Query("SELECT pt FROM PaymentToken pt WHERE pt.status = :status AND pt.expiresAt < :now")
    List<PaymentToken> findExpiredTokens(@Param("status") TokenStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(pt) FROM PaymentToken pt WHERE pt.customerId = :customerId AND pt.status = 'ACTIVE'")
    long countActiveTokensByCustomerId(@Param("customerId") String customerId);
}
