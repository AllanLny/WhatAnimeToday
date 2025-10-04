package fr.wat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * 🌐 DTO générique pour toutes les réponses API de WAT
 * Garantit une structure cohérente selon les bonnes pratiques REST
 */
public class ApiResponse<T> {
    
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("data")
    private T data;
    
    @JsonProperty("error")
    private String error;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
    
    @JsonProperty("country")
    private String country;
    
    // Constructeurs
    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }
    
    public ApiResponse(boolean success, T data) {
        this();
        this.success = success;
        this.data = data;
    }
    
    public ApiResponse(boolean success, T data, String country) {
        this(success, data);
        this.country = country;
    }
    
    // Factory methods pour les réponses communes
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data);
    }
    
    public static <T> ApiResponse<T> success(T data, String country) {
        return new ApiResponse<>(true, data, country);
    }
    
    public static <T> ApiResponse<T> error(String errorMessage) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(errorMessage);
        return response;
    }
    
    // Getters et Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    @Override
    public String toString() {
        return "ApiResponse{" +
                "success=" + success +
                ", data=" + data +
                ", error='" + error + '\'' +
                ", timestamp=" + timestamp +
                ", country='" + country + '\'' +
                '}';
    }
}