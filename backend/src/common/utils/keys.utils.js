import { readFileSync } from "node:fs";
import path from "node:path";
import { generateKeyPairSync } from "node:crypto";
import jose from "node-jose";
import { hasDefaultPrivateKey, readDefaultPrivateKeyPem } from "./cert.js";

let signingKey;
let jwksCache = { keys: [] };
let activeKid = "oidc-1";

/**
 * Issuer without trailing slash (string).
 */
export const getOidcIssuer = () => {
  const fromEnv = process.env.OIDC_ISSUER?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const port = process.env.PORT || 4000;
  return `http://localhost:${port}`;
};

const loadPem = () => {
  let pem = process.env.OIDC_RSA_PRIVATE_KEY;
  if (pem) {
    return pem.replace(/\\n/g, "\n");
  }
  const keyPath = process.env.OIDC_RSA_PRIVATE_KEY_PATH;
  if (keyPath) {
    return readFileSync(path.resolve(keyPath), "utf8");
  }
  if (hasDefaultPrivateKey()) {
    return readDefaultPrivateKeyPem();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set OIDC_RSA_PRIVATE_KEY, OIDC_RSA_PRIVATE_KEY_PATH, or add backend/cert/private-key.pem (pnpm oidc:generate-keys)"
    );
  }
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  console.warn(
    "[OIDC] No OIDC_RSA_PRIVATE_KEY: using ephemeral RSA (dev). Keys rotate on every restart. Persist a PEM in production."
  );
  return privateKey.export({ type: "pkcs8", format: "pem" });
};

/**
 * Call once at startup (after env is loaded).
 */
export const initOidcKeys = async () => {
  activeKid = process.env.OIDC_KEY_ID || "oidc-1";
  const pem = loadPem();
  signingKey = await jose.JWK.asKey(pem, "pem");

  const publicJwk = signingKey.toJSON();
  jwksCache = {
    keys: [
      {
        ...publicJwk,
        kid: activeKid,
        use: "sig",
        alg: "RS256",
      },
    ],
  };
};

export const getJwksDocument = () => jwksCache;

export const getKeyId = () => activeKid;

/**
 * @param {Record<string, unknown>} claims - iss, sub, aud, and optional nonce, email, name, etc.
 */
export const signIdToken = async (claims) => {
  if (!signingKey) {
    throw new Error("initOidcKeys() must be called before signIdToken");
  }
  const str = JSON.stringify(claims);
  return jose.JWS.createSign(
    {
      format: "compact",
      fields: { alg: "RS256", typ: "JWT", kid: activeKid },
    },
    signingKey,
  )
    .update(str, "utf8")
    .final();
};
