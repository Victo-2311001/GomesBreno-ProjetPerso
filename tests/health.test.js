import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("GET /health", () => {
  it("retourne ok: true et le nom du modèle", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.model).toBeDefined();
  });
});