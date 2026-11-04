import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();
  const t = (text || "").toLowerCase().trim();
  let score = 10;
  const flags: string[] = [];

  const isUrl = t.includes("http") || t.includes("www.") || t.includes(".com") || t.includes(".ng") || t.includes("bit.ly") || t.includes("tinyurl");

  // --- 1. MESSAGE SCAM WORDS (your old logic) ---
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

  // --- 2. URL CHECKS (this is the fix) ---
  if (isUrl) {
    // Extract domain
    let domain = t.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split("?")[0];

    // a) Shorteners - hide real destination
    if (["bit.ly","tinyurl.com","t.co","cutt.ly","is.gd","shorte.st","rebrand.ly"].some(s => domain.includes(s))) {
      score += 30; flags.push("Uses a link shortener - real destination hidden");
    }

    // b) Brand impersonation: mentions a real brand but domain is NOT the real one
    const brands: Record<string, string[]> = {
      "opay": ["opay.ng", "opay.com"],
      "gtbank": ["gtbank.com", "gtb.com"],
      "access": ["accessbankplc.com"],
      "firstbank": ["firstbanknigeria.com"],
      "zenith": ["zenithbank.com"],
      "uba": ["ubagroup.com"],
      "flutterwave": ["flutterwave.com"],
      "paypal": ["paypal.com"],
      "binance": ["binance.com"],
    };
    for (const brand in brands) {
      if (t.includes(brand) && !brands[brand].some(real => domain === real || domain.endsWith("." + real))) {
        score += 40; flags.push(`Claims to be ${brand.toUpperCase()} but domain is ${domain} - likely fake`);
        break;
      }
    }

    // c) Phishing keywords in URL
    if (["verify", "login", "secure", "update", "suspended", "blocked", "confirm"].some(w => t.includes(w))) {
      score += 25; flags.push("URL uses phishing words like verify / login / secure");
    }

    // d) Bank + login combo in fake domain
    if (t.includes("bank") && (t.includes("login") || t.includes("verify"))) {
      score += 20; flags.push("Fake bank login pattern");
    }

    // e) Too many hyphens = lookalike domain
    if ((domain.match(/-/g) || []).length >= 2) {
      score += 15; flags.push("Suspicious domain with many hyphens");
    }

    // f) IP address instead of domain
    if (/\d+\.\d+\.\d+\.\d+/.test(domain)) {
      score += 35; flags.push("Link uses an IP address instead of a real domain");
    }

    // g) Not HTTPS
    if (t.startsWith("http://")) {
      score += 15; flags.push("Not using secure HTTPS");
    }
  }

  score = Math.min(score, 98);
  const verdict = score >= 70 ? "HIGH RISK - Likely Scam" : score >= 40 ? "MEDIUM RISK - Be Careful" : "LOW RISK - Looks Okay";
  const reason = score >= 70 ? "This has multiple classic scam patterns. Do not send money." : score >= 40 ? "Some warning signs. Verify the person/company before you proceed." : "No strong scam patterns found, but stay cautious.";

  return NextResponse.json({ score, verdict, reason, flags });
}
