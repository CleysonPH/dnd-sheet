import { beforeEach, describe, expect, it } from "vitest";

import { clearMailbox, waitForMessage } from "@/server/test/mailpit";

import { sendMail } from "./index";

beforeEach(clearMailbox);

describe("sendMail", () => {
  it("entrega pelo SMTP configurado", async () => {
    await sendMail({
      to: "lyra@mesa.com",
      subject: "Teste de envio",
      text: "Olá, Lyra.",
      html: "<p>Olá, Lyra.</p>",
    });

    const message = await waitForMessage("lyra@mesa.com");
    expect(message.Subject).toBe("Teste de envio");
    expect(message.Text.trim()).toBe("Olá, Lyra.");
  });
});
