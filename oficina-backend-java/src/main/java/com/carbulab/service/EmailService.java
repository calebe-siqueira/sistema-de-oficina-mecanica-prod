package com.carbulab.service;

import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável pelo envio de e-mails do sistema Carbulab.
 * 
 * Utiliza o cliente de e-mail oficial e nativo do Spring Boot (JavaMailSender / Spring Boot Starter Mail),
 * com suporte completo a e-mails responsivos em formato HTML e texto plano com charset UTF-8.
 * 
 * Cenários de envio do sistema:
 * - Credenciais de primeiro acesso para clientes cadastrados
 * - Código de verificação para alteração de e-mail no perfil
 * - Código de verificação para recuperação de senha
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String fromName;
    private final boolean mailEnabled;
    private final String configuredUsername;
    private final String configuredPassword;

    @Autowired
    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${carbulab.mail.from:${spring.mail.username:[EMAIL_ADDRESS]}}") String fromEmail,
            @Value("${carbulab.mail.from-name:[MAIL_FROM_NAME]}") String fromName,
            @Value("${carbulab.mail.enabled:true}") boolean mailEnabled,
            @Value("${spring.mail.username:}") String configuredUsername,
            @Value("${spring.mail.password:}") String configuredPassword) {
        this.mailSender = mailSender;
        this.fromEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "[EMAIL_ADDRESS]";
        this.fromName = (fromName != null && !fromName.isBlank()) ? fromName.trim() : "Mecânica Carbulab";
        this.mailEnabled = mailEnabled;
        this.configuredUsername = configuredUsername != null ? configuredUsername.trim() : "";
        this.configuredPassword = configuredPassword != null ? configuredPassword.trim() : "";
    }

    /**
     * Construtor simplificado para testes e injeção direta.
     */
    public EmailService(JavaMailSender mailSender) {
        this(mailSender, "noreply.carbulab@gmail.com", "Mecânica Carbulab", true, "noreply.carbulab@gmail.com", "configurado");
    }

    /**
     * Construtor flexível para cenários de testes unitários.
     */
    public EmailService(JavaMailSender mailSender, String fromEmail, String fromName, boolean mailEnabled) {
        this(mailSender, fromEmail, fromName, mailEnabled, "noreply.carbulab@gmail.com", "configurado");
    }

    /**
     * Envia credenciais de primeiro acesso para um cliente da oficina.
     */
    public boolean enviarCredenciaisPrimeiroAcesso(String emailDestinatario, String nomeCliente, String login, String senhaTemporaria) {
        String nomeExibicao = (nomeCliente != null && !nomeCliente.isBlank()) ? nomeCliente.trim() : "Cliente";
        String assunto = "Bem-vindo à Carbulab — Suas credenciais de acesso";

        String corpoTexto = String.format(
            "Olá, %s!\n\n" +
            "Seu acesso ao Portal do Cliente Carbulab foi criado com sucesso.\n\n" +
            "Seus dados de login:\n" +
            "- Login (ou e-mail): %s\n" +
            "- Senha temporária: %s\n\n" +
            "Por questões de segurança, recomendamos que altere sua senha no primeiro acesso através do seu perfil.\n\n" +
            "Atenciosamente,\n" +
            "Equipe Carbulab",
            nomeExibicao,
            login,
            senhaTemporaria
        );

        String conteudoHtml = String.format(
            "<p style=\"margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;\">" +
            "  Olá, <strong>%s</strong>!" +
            "</p>" +
            "<p style=\"margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;\">" +
            "  Seu acesso ao <strong>Portal do Cliente Carbulab</strong> foi criado com sucesso. Agora você pode acompanhar em tempo real o andamento dos seus veículos, aprovar orçamentos e consultar o histórico de manutenções." +
            "</p>" +
            "<div style=\"background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;\">" +
            "  <p style=\"margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;\">Credenciais de Primeiro Acesso</p>" +
            "  <table role=\"presentation\" width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"4\">" +
            "    <tr>" +
            "      <td width=\"35%%\" style=\"font-size: 14px; color: #64748b; font-weight: 500;\">Login / E-mail:</td>" +
            "      <td style=\"font-size: 14px; color: #0f172a; font-weight: 700;\">%s</td>" +
            "    </tr>" +
            "    <tr>" +
            "      <td style=\"font-size: 14px; color: #64748b; font-weight: 500;\">Senha temporária:</td>" +
            "      <td>" +
            "        <span style=\"display: inline-block; background-color: #e2e8f0; color: #0f172a; font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px;\">%s</span>" +
            "      </td>" +
            "    </tr>" +
            "  </table>" +
            "</div>" +
            "<div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;\">" +
            "  <p style=\"margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;\">" +
            "    <strong>Recomendação de Segurança:</strong> Por questões de segurança, recomendamos que altere sua senha no primeiro acesso através da opção <em>Meu Perfil</em>." +
            "  </p>" +
            "</div>",
            nomeExibicao,
            login,
            senhaTemporaria
        );

        String corpoHtml = construirTemplateBase("Bem-vindo à Carbulab", "Credenciais de Acesso", conteudoHtml);
        return enviarEmailHtml(emailDestinatario, assunto, corpoTexto, corpoHtml);
    }

    /**
     * Envia código de verificação para validação de novo e-mail no perfil do cliente.
     */
    public boolean enviarCodigoVerificacaoTrocaEmail(String emailDestinatario, String nomeCliente, String codigo) {
        String nomeExibicao = (nomeCliente != null && !nomeCliente.isBlank()) ? nomeCliente.trim() : "Cliente";
        String assunto = "Carbulab — Verificação de Alteração de E-mail";

        String corpoTexto = String.format(
            "Olá, %s!\n\n" +
            "Recebemos uma solicitação para alterar o e-mail de sua conta Carbulab para este endereço.\n\n" +
            "O seu código de verificação é: %s\n\n" +
            "Este código é válido por 15 minutos. Se você não solicitou esta alteração, por favor ignore esta mensagem.\n\n" +
            "Atenciosamente,\n" +
            "Equipe Carbulab",
            nomeExibicao,
            codigo
        );

        String conteudoHtml = String.format(
            "<p style=\"margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;\">" +
            "  Olá, <strong>%s</strong>!" +
            "</p>" +
            "<p style=\"margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;\">" +
            "  Recebemos uma solicitação para vincular este endereço de e-mail à sua conta no sistema Carbulab. Para confirmar a alteração, utilize o código abaixo:" +
            "</p>" +
            "<div style=\"text-align: center; margin: 28px 0;\">" +
            "  <p style=\"margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;\">Código de Verificação</p>" +
            "  <div style=\"display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 14px 28px;\">" +
            "    <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace;\">%s</span>" +
            "  </div>" +
            "  <p style=\"margin: 10px 0 0 0; font-size: 13px; color: #64748b;\">Este código expira em <strong>15 minutos</strong>.</p>" +
            "</div>" +
            "<div style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-top: 20px;\">" +
            "  <p style=\"margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;\">" +
            "    Se você não solicitou esta alteração, ignore este e-mail. Nenhuma modificação será realizada sem este código." +
            "  </p>" +
            "</div>",
            nomeExibicao,
            codigo
        );

        String corpoHtml = construirTemplateBase("Alteração de E-mail", "Confirmação de Segurança", conteudoHtml);
        return enviarEmailHtml(emailDestinatario, assunto, corpoTexto, corpoHtml);
    }

    /**
     * Envia código de verificação para recuperação de senha.
     */
    public boolean enviarCodigoRecuperacaoSenha(String emailDestinatario, String nomeUsuario, String codigo) {
        String nomeExibicao = (nomeUsuario != null && !nomeUsuario.isBlank()) ? nomeUsuario.trim() : "Usuário";
        String assunto = "Carbulab — Recuperação de Senha";

        String corpoTexto = String.format(
            "Olá, %s!\n\n" +
            "Recebemos uma solicitação de redefinição de senha para a sua conta no Sistema Carbulab.\n\n" +
            "O seu código de recuperação é: %s\n\n" +
            "Este código é válido por 15 minutos. Caso não tenha solicitado a alteração de senha, ignore este e-mail.\n\n" +
            "Atenciosamente,\n" +
            "Equipe Carbulab",
            nomeExibicao,
            codigo
        );

        String conteudoHtml = String.format(
            "<p style=\"margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;\">" +
            "  Olá, <strong>%s</strong>!" +
            "</p>" +
            "<p style=\"margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;\">" +
            "  Recebemos uma solicitação de redefinição de senha para o seu acesso ao Sistema Carbulab. Utilize o código de segurança abaixo para prosseguir com a redefinição:" +
            "</p>" +
            "<div style=\"text-align: center; margin: 28px 0;\">" +
            "  <p style=\"margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;\">Código de Recuperação</p>" +
            "  <div style=\"display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 14px 28px;\">" +
            "    <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace;\">%s</span>" +
            "  </div>" +
            "  <p style=\"margin: 10px 0 0 0; font-size: 13px; color: #64748b;\">Este código expira em <strong>15 minutos</strong>.</p>" +
            "</div>" +
            "<div style=\"background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-top: 20px;\">" +
            "  <p style=\"margin: 0; font-size: 13px; line-height: 1.5; color: #991b1b;\">" +
            "    <strong>Atenção:</strong> Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá inalterada." +
            "  </p>" +
            "</div>",
            nomeExibicao,
            codigo
        );

        String corpoHtml = construirTemplateBase("Recuperação de Senha", "Redefinição de Acesso", conteudoHtml);
        return enviarEmailHtml(emailDestinatario, assunto, corpoTexto, corpoHtml);
    }

    /**
     * Envia e-mail em texto simples utilizando a infraestrutura do Spring Mail.
     */
    public boolean enviarEmail(String emailDestinatario, String assunto, String mensagem) {
        return enviarEmailHtml(emailDestinatario, assunto, mensagem, null);
    }

    /**
     * Método principal de envio de e-mails via JavaMailSender nativo do Spring Boot.
     * Suporta mensagem multipart/alternative (texto e HTML simultâneos).
     */
    public boolean enviarEmailHtml(String emailDestinatario, String assunto, String corpoTexto, String corpoHtml) {
        if (emailDestinatario == null || emailDestinatario.trim().isEmpty()) {
            logger.warn("Tentativa de envio de e-mail ignorada: destinatário não informado ou nulo.");
            return false;
        }

        String destinatario = emailDestinatario.trim();

        if (!mailEnabled) {
            logger.info("Envio de e-mail desabilitado por configuração (carbulab.mail.enabled=false). E-mail para '{}' ignorado.", destinatario);
            return false;
        }

        if (configuredUsername.isBlank() || configuredPassword.isBlank()) {
            logger.warn("Credenciais SMTP não configuradas (spring.mail.username ou spring.mail.password vazios). E-mail para '{}' com assunto '{}' não foi disparado.",
                    destinatario, assunto);
            return false;
        }

        if (mailSender == null) {
            logger.warn("JavaMailSender não está disponível no contexto do Spring. E-mail para '{}' não foi disparado.", destinatario);
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            boolean isMultipart = (corpoHtml != null && !corpoHtml.isBlank());
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, isMultipart, StandardCharsets.UTF_8.name());

            if (fromName != null && !fromName.isBlank()) {
                helper.setFrom(fromEmail, fromName);
            } else {
                helper.setFrom(fromEmail);
            }

            helper.setTo(destinatario);
            helper.setSubject(assunto != null ? assunto : "Notificação Carbulab");

            if (isMultipart) {
                helper.setText(corpoTexto != null ? corpoTexto : "", corpoHtml);
            } else {
                helper.setText(corpoTexto != null ? corpoTexto : "", false);
            }

            mailSender.send(mimeMessage);
            logger.info("E-mail enviado com sucesso via Spring Mail para '{}' com assunto '{}'", destinatario, assunto);
            return true;

        } catch (MailAuthenticationException e) {
            logger.error("Falha de autenticação SMTP ao enviar e-mail para '{}'. " +
                         "Verifique as credenciais configuradas em 'spring.mail.username' e 'spring.mail.password' (ou variáveis MAIL_USERNAME / MAIL_PASSWORD). " +
                         "No Gmail, utilize uma 'Senha de App' de 16 caracteres com 2FA ativo na Conta Google. Detalhes: {}",
                         destinatario, e.getMessage());
            return false;
        } catch (MailException e) {
            logger.error("Erro do Spring Mail ao enviar e-mail para '{}': {}", destinatario, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Erro inesperado ao enviar e-mail para '{}': {}", destinatario, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Constrói o layout HTML padrão de e-mails do sistema Carbulab.
     */
    private String construirTemplateBase(String titulo, String subtitulo, String conteudoHtml) {
        return String.format(
            "<!DOCTYPE html>" +
            "<html lang=\"pt-BR\">" +
            "<head>" +
            "  <meta charset=\"UTF-8\">" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
            "  <title>%s</title>" +
            "</head>" +
            "<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">" +
            "  <table role=\"presentation\" width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 30px 15px;\">" +
            "    <tr>" +
            "      <td align=\"center\">" +
            "        <table role=\"presentation\" width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;\">" +
            "          <tr>" +
            "            <td style=\"background: linear-gradient(135deg, #0f172a 0%%, #1e293b 100%%); padding: 26px 32px; text-align: center; border-bottom: 3px solid #2563eb;\">" +
            "              <h1 style=\"margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 2px;\">CARBULAB</h1>" +
            "              <p style=\"margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;\">Oficina Mecânica</p>" +
            "            </td>" +
            "          </tr>" +
            "          <tr>" +
            "            <td style=\"padding: 32px 32px 24px 32px;\">" +
            "              <h2 style=\"margin: 0 0 6px 0; color: #0f172a; font-size: 19px; font-weight: 700;\">%s</h2>" +
            "              <p style=\"margin: 0 0 20px 0; color: #64748b; font-size: 13px; font-weight: 500;\">%s</p>" +
            "              %s" +
            "            </td>" +
            "          </tr>" +
            "          <tr>" +
            "            <td style=\"background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;\">" +
            "              <p style=\"margin: 0 0 4px 0; color: #64748b; font-size: 12px; line-height: 1.5;\">" +
            "                Este é um e-mail automático gerado pelo <strong>Sistema Carbulab</strong>.<br>Por favor, não responda diretamente a esta mensagem." +
            "              </p>" +
            "              <p style=\"margin: 0; color: #94a3b8; font-size: 11px;\">" +
            "                &copy; 2026 Carbulab Oficina Mecânica. Todos os direitos reservados." +
            "              </p>" +
            "            </td>" +
            "          </tr>" +
            "        </table>" +
            "      </td>" +
            "    </tr>" +
            "  </table>" +
            "</body>" +
            "</html>",
            titulo,
            titulo,
            subtitulo,
            conteudoHtml
        );
    }
}
