import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("POST /chat", () => {
  it("retourne une erreur 400 si le champ 'content' est manquant", async () => {
    const res = await request(app).post("/chat").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing 'content' in body");
  });

  it("retourne une erreur 400 si le champ 'content' est vide", async () => {
    const res = await request(app).post("/chat").send({ content: "" });

    expect(res.status).toBe(400);
  });
});

//Utilisation de l'IA pour faire un test avec le post qui vérifie la réponse de l'IA en fonction du contenu envoyé