package com.carbulab.utils;

import java.util.Properties;
import java.util.Random;
import org.apache.commons.mail.DefaultAuthenticator;
import org.apache.commons.mail.SimpleEmail;

public class EnvioDeEmail {
    
    
    public static int enviarEmail(String emailDestinatario) {
        
        String emailRemetente = "samucasiqueira11@gmail.com";
        String senhaRemetente = "znmt dowh bmgj yvty";
        
        SimpleEmail email = new SimpleEmail();
        email.setHostName("smtp.gmail.com");
        email.setSmtpPort(465);
        email.setAuthenticator(new DefaultAuthenticator(emailRemetente, senhaRemetente));
        email.setSSLOnConnect(true);
        
        Properties properties = System.getProperties();
        properties.put("mail.smtp.ssl.protocols","TLSv1.2");
        
        // Gerador do código de segurança aleatório:
        Random random = new Random();
        int codigoSeguranca = random.nextInt(9999);
        
        try {
            email.setFrom(emailRemetente);
            email.setSubject("Verificação Carbulab");
            email.setMsg("O seu código de verificação para a sua conta no Sistema Carbulab é: " + codigoSeguranca);
            email.addTo(emailDestinatario);
            email.send();
            return codigoSeguranca;
        } catch (Exception e) {
            System.out.println("Erro no envio do e-mail:" + e.getMessage());
        }
        
        return -1;
    }
    
}
