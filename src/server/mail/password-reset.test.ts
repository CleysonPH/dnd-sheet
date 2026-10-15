import { describe, expect, it } from "vitest";

import { passwordResetMail, passwordResetUrl } from "./password-reset";

describe("passwordResetUrl", () => {
  it("aponta para /redefinir-senha com o token", () => {
    expect(passwordResetUrl("https://ficha.mesa.com", "abc123")).toBe(
      "https://ficha.mesa.com/redefinir-senha?token=abc123",
    );
  });

  it("ignora a barra final da URL base", () => {
    expect(passwordResetUrl("http://localhost:3000/", "abc")).toBe(
      "http://localhost:3000/redefinir-senha?token=abc",
    );
  });
});

describe("passwordResetMail", () => {
  const mail = passwordResetMail({
    to: "lyra@mesa.com",
    name: "Lyra <Bardo>",
    url: "http://localhost:3000/redefinir-senha?token=abc",
  });

  it("tem o assunto da aplicação e o destinatário", () => {
    expect(mail.subject).toBe("Redefinir senha · Ficha D&D");
    expect(mail.to).toBe("lyra@mesa.com");
  });

  it("traz o link e a validade no texto", () => {
    expect(mail.text).toContain(
      "http://localhost:3000/redefinir-senha?token=abc",
    );
    expect(mail.text).toContain("1 hora");
  });

  it("escapa o nome no HTML", () => {
    expect(mail.html).toContain("Lyra &lt;Bardo&gt;");
    expect(mail.html).toContain(
      'href="http://localhost:3000/redefinir-senha?token=abc"',
    );
  });
});
