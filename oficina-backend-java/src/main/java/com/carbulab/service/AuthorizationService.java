package com.carbulab.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.carbulab.repositories.UsuarioRepository;

@Service
public class AuthorizationService implements UserDetailsService {

    private final UsuarioRepository repository;

    public AuthorizationService(UsuarioRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails user = repository.findByLoginOrEmail(username, username);
        if (user == null) {
            throw new UsernameNotFoundException("Usuário não encontrado com login ou email: " + username);
        }
        return user;
    }
    
}
