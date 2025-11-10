package dev.jstephenperry.webpos.payment.service;

import com.google.crypto.tink.Aead;
import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.aead.AeadConfig;
import com.google.crypto.tink.aead.AeadKeyTemplates;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;

/**
 * Service for encrypting and decrypting sensitive payment data using Google Tink
 */
@Service
@Slf4j
public class EncryptionService {

    private KeysetHandle keysetHandle;
    private Aead aead;
    private final String keyVersion = "v1";

    @PostConstruct
    public void init() throws GeneralSecurityException {
        AeadConfig.register();
        // In production, load this from a secure key management service
        keysetHandle = KeysetHandle.generateNew(AeadKeyTemplates.AES256_GCM);
        aead = keysetHandle.getPrimitive(Aead.class);
        log.info("Encryption service initialized with key version: {}", keyVersion);
    }

    /**
     * Encrypts plaintext data
     * @param plaintext The data to encrypt
     * @param associatedData Additional authenticated data (AAD)
     * @return Base64 encoded encrypted data
     */
    public String encrypt(String plaintext, String associatedData) {
        try {
            byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            byte[] associatedDataBytes = associatedData != null
                ? associatedData.getBytes(StandardCharsets.UTF_8)
                : new byte[0];

            byte[] ciphertext = aead.encrypt(plaintextBytes, associatedDataBytes);
            return Base64.getEncoder().encodeToString(ciphertext);
        } catch (GeneralSecurityException e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypts encrypted data
     * @param encryptedData Base64 encoded encrypted data
     * @param associatedData Additional authenticated data (AAD) used during encryption
     * @return Decrypted plaintext
     */
    public String decrypt(String encryptedData, String associatedData) {
        try {
            byte[] ciphertext = Base64.getDecoder().decode(encryptedData);
            byte[] associatedDataBytes = associatedData != null
                ? associatedData.getBytes(StandardCharsets.UTF_8)
                : new byte[0];

            byte[] plaintext = aead.decrypt(ciphertext, associatedDataBytes);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }

    public String getKeyVersion() {
        return keyVersion;
    }
}
