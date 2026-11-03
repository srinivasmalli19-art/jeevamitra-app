// Phone helpers for Call / WhatsApp buttons (Indian numbers).
export function phoneDigits(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return "91" + d;
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1);
  if (d.length === 12 && d.startsWith("91")) return d;
  return d.length >= 10 ? d : "";
}
export function telUrl(phone) {
  const d = phoneDigits(phone);
  return d ? `tel:+${d}` : "";
}
export function whatsappChatUrl(phone, text = "") {
  const d = phoneDigits(phone);
  return d ? `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
}
