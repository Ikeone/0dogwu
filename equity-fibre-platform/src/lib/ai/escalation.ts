/**
 * Escalation triggers for the support assistant. Certain categories MUST
 * escalate to a human immediately regardless of the knowledge base.
 */

export interface EscalationSignal {
  escalate: boolean;
  reason?: string;
  category?: string;
  priority?: "normal" | "high" | "urgent";
}

const IMMEDIATE_RULES: { re: RegExp; category: string; reason: string; priority: "high" | "urgent" }[] = [
  { re: /\b(shock|burning|smoke|fire|sparks?|electric)\b/i, category: "safety", reason: "Possible safety/electrical hazard.", priority: "urgent" },
  { re: /\b(threat|abuse|kill|hurt|harass)\b/i, category: "abuse", reason: "Threatening or abusive content.", priority: "urgent" },
  { re: /\b(privacy|breach|leaked|stolen data|complaint)\b/i, category: "privacy", reason: "Privacy concern or complaint.", priority: "high" },
  { re: /\b(dispute|charged twice|double charge|refund|unauthori[sz]ed)\b/i, category: "payment_dispute", reason: "Payment dispute.", priority: "high" },
  { re: /\b(not my account|someone else|hacked|took over)\b/i, category: "account_ownership", reason: "Account ownership dispute.", priority: "high" },
  { re: /\b(vulnerable|medical|disabled|elderly|emergency)\b/i, category: "vulnerable", reason: "Possible vulnerable-customer concern.", priority: "high" },
];

export function checkImmediateEscalation(message: string): EscalationSignal {
  for (const rule of IMMEDIATE_RULES) {
    if (rule.re.test(message)) {
      return { escalate: true, reason: rule.reason, category: rule.category, priority: rule.priority };
    }
  }
  return { escalate: false };
}

/**
 * Detect naive prompt-injection attempts so customer text cannot override the
 * system rules. We do not execute such instructions; we flag and ignore them.
 */
export function looksLikePromptInjection(message: string): boolean {
  return /\b(ignore (all |the )?(previous|above) (instructions|rules)|system prompt|you are now|reveal your (instructions|prompt)|act as)\b/i.test(
    message,
  );
}
