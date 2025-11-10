package dev.jstephenperry.webpos.payment.repository;

import dev.jstephenperry.webpos.payment.model.Payment;
import dev.jstephenperry.webpos.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByCustomerId(String customerId);

    List<Payment> findByCustomerIdAndStatus(String customerId, PaymentStatus status);

    List<Payment> findByOrderId(String orderId);

    @Query("SELECT p FROM Payment p WHERE p.customerId = :customerId AND p.createdAt BETWEEN :startDate AND :endDate")
    List<Payment> findByCustomerIdAndDateRange(
        @Param("customerId") String customerId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT p FROM Payment p WHERE p.status = :status AND p.createdAt < :cutoffDate")
    List<Payment> findOldPaymentsByStatus(
        @Param("status") PaymentStatus status,
        @Param("cutoffDate") LocalDateTime cutoffDate
    );
}
