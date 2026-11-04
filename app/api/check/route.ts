import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();
  const t = (text || "").toLowerCase().trim();
  let score = 10;
  const flags: string[] = [];

  const isUrl = t.includes("http") || t.includes("www.") || t.includes(".com") || t.includes(".ng") || t.includes("bit.ly");

  // --- 1. MESSAGE SCAM WORDS ---
  const checks = [
    ["double", "Promise to double your money", 35],
    ["guaranteed", "Guaranteed profit / no risk", 30],
    ["urgent", "Urgency pressure - act now", 20],
    ["whatsapp", "Moved to WhatsApp / Telegram", 15],
    ["crypto", "Crypto / forex doubling scheme", 20],
    ["send", "Asking you to send money first", 25],
    ["account", "Asking for account / OTP / PIN", 30],
    ["investment", "Unregistered investment promise", 25],
  ] as const;

  for (const [word, label, points] of checks) {
    if (t.includes(word)) { score += points; flags.push(label); }
  }
  if (/\d+%/.test(t) && t.includes("profit")) { score += 20; flags.push("Unrealistic profit %"); }
  if (t.includes("http")) { score += 10; flags.push("Contains a link"); }

  // --- 2. URL CHECKS ---
  if (isUrl) {
    let domain = t.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    let path = t.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/").slice(1).join("/");

    // a) Shorteners - hide real destination
    if (["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "rebrand.ly"].some(s => domain === s)) {
      score += 30; flags.push("Uses a link shortener - hides real destination");
    }

    // b) Brand impersonation: brand in domain OR path, but domain is NOT official
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
      const isOfficial = brands[brand].some(real => domain === real || domain.endsWith("." + real));
      const mentionsBrand = domain.includes(brand) || path.includes(brand);
      if (mentionsBrand && !isOfficial) {
        score += 40; flags.push(`Claims to be ${brand} but domain is ${domain} - not official`);
        break;
      }
    }

    // c) Phishing keywords in URL
    if (["verify", "login", "secure", "update", "suspend", "confirm", "unlock"].some(w => t.includes(w))) {
      score += 25; flags.push("URL uses phishing word (verify/login/secure)");
    }

    // d) Bank + login combo
    if (t.includes("bank") && t.includes("login")) {
      score += 20; flags.push("Fake bank login combo");
    }

    // e) Too many hyphens in DOMAIN only (not full link)
    if ((domain.match(/-/g) || []).length >= 2) {
      score += 15; flags.push("Suspicious domain with many hyphens");
    }

    // f) IP address instead of domain
    if (/\d+\.\d+\.\d+\.\d+/.test(domain)) {
      score += 35; flags.push("Link uses an IP address instead of a domain");
    }

    // g) Not HTTPS
    if (t.startsWith("http://")) {
      score += 15; flags.push("Not using secure HTTPS");
    }
  }

  score = Math.min(score, 98);
  const verdict = score >= 70 ? "HIGH RISK - DO NOT CLICK" : score >= 40 ? "SUSPICIOUS - BE CAREFUL" : "LOW RISK";
  // FIX: Use the actual flags as the reason, not one generic message
  const reason = flags.length > 0 ? flags.join(" • ") : "No scam signals found.";

  return NextResponse.json({ score, verdict, reason, flags });
}
