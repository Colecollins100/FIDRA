import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();
  const t = (text || "").toLowerCase();
  let score = 10;
  const flags: string[] = [];

  const checks = [
    ["double", "Promise to double your money", 35],
    ["guaranteed", "Guaranteed profit / no risk", 30],
    ["urgent", "Urgency pressure - act now", 20],
    ["whatsapp", "Moved to WhatsApp / Telegram", 15],
    ["crypto", "Crypto / forex doubling scheme", 20],
    ["send", "Asking you to send money first", 25],
    ["account", "Asking for account / OTP / PIN", 30],
    ["investment", "Unregistered investment promise", 15],
  ] as const;

  for (const [word, label, points] of checks) {
    if (t.includes(word)) { score += points; flags.push(label); }
  }
  if (/\d+%/.test(t) && t.includes("profit")) { score += 20; flags.push("Unrealistic % profit promised"); }
  if (t.includes("http")) { score += 10; flags.push("Contains a link - verify it separately"); }

  score = Math.min(score, 98);
  const verdict = score >= 70 ? "HIGH RISK - Likely Scam" : score >= 40 ? "MEDIUM RISK - Be Careful" : "LOW RISK - Looks Okay";
  const reason = score >= 70 ? "This has multiple classic scam patterns. Do not send money." : score >= 40 ? "Some warning signs. Verify the person/company before you proceed." : "No strong scam patterns found, but stay cautious.";

  return NextResponse.json({ score, verdict, reason, flags });
}
