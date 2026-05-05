import {
  serverEnvSchema,
  type ServerEnv,
} from "@/lib/validators/env";

export function getServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverEnvSchema.parse(source);
}
