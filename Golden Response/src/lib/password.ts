import argon2 from "argon2";

// argon2id — the memory-hard algorithm OWASP recommends. Parameters follow
// the OWASP cheat-sheet baseline (19 MiB memory, 2 iterations, 1 lane).
const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
