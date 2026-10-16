import { createConnection, createServer, type Server } from "node:net";

import { Pool } from "pg";
import { afterEach, describe, expect, it } from "vitest";

import { testDatabaseUrl } from "@/server/test/database-url";

import { RetryingPool } from "./retrying-pool";

/*
 * Conexão derrubada antes da consulta, como o Neon ao acordar (design Y2):
 * um proxy TCP fecha as primeiras `drops` conexões e repassa as seguintes
 * para o Postgres de teste.
 */

const target = new URL(testDatabaseUrl());
const servers: Server[] = [];
const pools: Pool[] = [];

async function flakyProxy(drops: number): Promise<string> {
  let dropped = 0;
  const server = createServer((socket) => {
    if (dropped < drops) {
      dropped++;
      socket.destroy();
      return;
    }
    const upstream = createConnection(
      Number(target.port || 5432),
      target.hostname,
    );
    socket.pipe(upstream).pipe(socket);
    socket.on("error", () => upstream.destroy());
    upstream.on("error", () => socket.destroy());
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  const url = new URL(target);
  url.hostname = "127.0.0.1";
  url.port = String(port);
  return url.toString();
}

function track<T extends Pool>(pool: T): T {
  pools.push(pool);
  return pool;
}

afterEach(async () => {
  await Promise.all(pools.splice(0).map((pool) => pool.end()));
  await Promise.all(
    servers
      .splice(0)
      .map((server) => new Promise((resolve) => server.close(resolve))),
  );
});

describe("RetryingPool", () => {
  it("o Pool comum falha quando a primeira conexão cai", async () => {
    const pool = track(new Pool({ connectionString: await flakyProxy(1) }));
    await expect(pool.query("select 1")).rejects.toThrow();
  });

  it("repete a conexão e faz a consulta (pool.query, com callback)", async () => {
    const pool = track(
      new RetryingPool({ connectionString: await flakyProxy(2) }),
    );
    const result = await pool.query("select 1 as ok");
    expect(result.rows).toEqual([{ ok: 1 }]);
  });

  it("repete a conexão no connect com promessa", async () => {
    const pool = track(
      new RetryingPool({ connectionString: await flakyProxy(1) }),
    );
    const client = await pool.connect();
    expect((await client.query("select 2 as ok")).rows).toEqual([{ ok: 2 }]);
    client.release();
  });

  it("desiste depois de 2 novas tentativas", async () => {
    const pool = track(
      new RetryingPool({ connectionString: await flakyProxy(3) }),
    );
    await expect(pool.query("select 1")).rejects.toThrow();
  });

  it("não repete erro de consulta", async () => {
    const pool = track(
      new RetryingPool({ connectionString: await flakyProxy(0) }),
    );
    await expect(pool.query("select from nada_existe")).rejects.toThrow(
      /nada_existe/,
    );
  });
});
