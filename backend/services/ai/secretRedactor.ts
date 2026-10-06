/**
 * Secret detection and redaction layer.
 * Sanitizes untrusted repository and user text before sending to LLM.
 */

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  // GitHub Personal & App Access Tokens
  { name: "github_pat", regex: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/g },
  { name: "github_fine_grained", regex: /\bgithub_pat_[a-zA-Z0-9_]{50,}\b/g },

  // OpenAI & Anthropic Keys
  { name: "openai_key", regex: /\bsk-[a-zA-Z0-9]{20,T3BlbkFJ[a-zA-Z0-9]{20,}\b/g },
  { name: "openai_proj_key", regex: /\bsk-proj-[a-zA-Z0-9_-]{40,}\b/g },
  { name: "anthropic_key", regex: /\bsk-ant-[a-zA-Z0-9_-]{40,}\b/g },

  // Google Gemini / Cloud API Keys
  { name: "google_api_key", regex: /\bAIza[0-9A-Za-z-_]{30,40}\b/g },

  // AWS Access Keys
  { name: "aws_access_key", regex: /\b(AKIA|ASIA|AROA)[0-9A-Z]{16}\b/g },

  // RSA / EC / SSH Private Keys
  {
    name: "private_key",
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g,
  },

  // JWT Tokens
  {
    name: "jwt_token",
    regex: /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g,
  },

  // Database Connection Strings with Passwords
  {
    name: "db_uri",
    regex: /\b(mongodb(\+srv)?|postgres|postgresql|mysql|redis):\/\/[a-zA-Z0-9_.-]+:([^@\s/]+)@[a-zA-Z0-9_.-]+/gi,
  },

  // Generic Secret / Password / Token Key-Value pairs
  {
    name: "generic_secret_kv",
    regex: /(?:api[_-]?key|secret|password|passwd|auth[_-]?token|bearer[_-]?token|private[_-]?key)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.!@#$%^&*]{8,})["']?/gi,
  },
];

export function redactSecrets(input: string): {
  sanitized: string;
  hasRedactions: boolean;
  redactionCount: number;
} {
  if (!input || typeof input !== "string") {
    return { sanitized: "", hasRedactions: false, redactionCount: 0 };
  }

  let sanitized = input;
  let redactionCount = 0;

  for (const { name, regex } of SECRET_PATTERNS) {
    if (name === "db_uri") {
      sanitized = sanitized.replace(regex, (match, proto, _sub, _pass) => {
        redactionCount++;
        return `${proto}://[REDACTED_USER]:[REDACTED_SECRET]@[REDACTED_HOST]`;
      });
    } else if (name === "generic_secret_kv") {
      sanitized = sanitized.replace(regex, (match) => {
        redactionCount++;
        const parts = match.split(/[:=]/);
        if (parts.length >= 2) {
          return `${parts[0]}=[REDACTED_SECRET]`;
        }
        return "[REDACTED_SECRET]";
      });
    } else {
      sanitized = sanitized.replace(regex, () => {
        redactionCount++;
        return "[REDACTED_SECRET]";
      });
    }
  }

  return {
    sanitized,
    hasRedactions: redactionCount > 0,
    redactionCount,
  };
}
