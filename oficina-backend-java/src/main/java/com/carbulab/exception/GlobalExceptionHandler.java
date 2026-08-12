package com.carbulab.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.servlet.http.HttpServletRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentialsException(InvalidCredentialsException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.UNAUTHORIZED.value(),
            "Unauthorized",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiError> handleDuplicateResourceException(DuplicateResourceException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.CONFLICT.value(),
            "Conflict",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(PlacaConflictException.class)
    public ResponseEntity<Map<String, Object>> handlePlacaConflictException(PlacaConflictException ex, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("type", "DUPLICATE_PLATE_OTHER_CLIENT");
        body.put("message", ex.getMessage());
        body.put("owners", ex.getOutrosProprietarios());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleEntityNotFoundException(jakarta.persistence.EntityNotFoundException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage() != null ? ex.getMessage() : "Recurso não encontrado.",
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiError> handleUsernameNotFoundException(UsernameNotFoundException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.UNAUTHORIZED.value(),
            "Unauthorized",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(PdfGenerationException.class)
    public ResponseEntity<ApiError> handlePdfGenerationException(PdfGenerationException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(TokenException.class)
    public ResponseEntity<ApiError> handleTokenException(TokenException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<ApiError> handleBusinessValidationException(BusinessValidationException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();
        
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Validation Error",
            "Erro na validação dos dados enviados.",
            request.getRequestURI(),
            errors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalStateException(IllegalStateException ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage(),
            request.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        String message = "Erro de integridade de dados.";
        Throwable rootCause = ex.getRootCause();
        if (rootCause != null) {
            String rootMsg = rootCause.getMessage();
            if (rootMsg != null) {
                if (rootMsg.contains("Duplicate entry")) {
                    if (rootMsg.contains("cpf_cnpj")) {
                        message = "Já existe um cliente cadastrado com este CPF/CNPJ.";
                    } else if (rootMsg.contains("email")) {
                        message = "Este e-mail já está cadastrado.";
                    } else if (rootMsg.contains("login")) {
                        message = "Este login já está cadastrado.";
					} else if (rootMsg.contains("cep")) {
                        message = "Não foi possível realizar a ação. Este CEP já existe na base de dados.";
                    } else {
                        message = "Não foi possível realizar a ação. Registro duplicado.";
                    }
                    ApiError error = new ApiError(
                        Instant.now(),
                        HttpStatus.CONFLICT.value(),
                        "Conflict",
                        message,
                        request.getRequestURI(),
                        List.of(rootMsg)
                    );
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
                }
            }
        }
        
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            message,
            request.getRequestURI(),
            List.of(ex.getMostSpecificCause().getMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
        ApiError error = new ApiError(
            Instant.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            "Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.",
            request.getRequestURI(),
            List.of(ex.getMessage() != null ? ex.getMessage() : ex.toString())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
