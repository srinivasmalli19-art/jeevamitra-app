// Push / bell notification texts in English, Telugu and Hindi.
// Terms follow docs/translation-glossary.md. {placeholders} are filled by fmt().
export const LANGS = ["en", "te", "hi"];

export const ANIMALS = {
  sheep: { en: "sheep", te: "గొర్రెలు", hi: "भेड़ें" },
  goat: { en: "goats", te: "మేకలు", hi: "बकरियाँ" },
  cattle: { en: "cattle", te: "ఆవులు-ఎద్దులు", hi: "गाय-बैल" },
  buffalo: { en: "buffaloes", te: "గేదెలు", hi: "भैंसें" },
  mixed: { en: "animals", te: "పశువులు", hi: "पशु" },
};

export const CROPS = {
  paddy: { en: "paddy", te: "వరి", hi: "धान" },
  jowar: { en: "jowar", te: "జొన్న", hi: "ज्वार" },
  maize: { en: "maize", te: "మొక్కజొన్న", hi: "मक्का" },
  bajra: { en: "bajra", te: "సజ్జ", hi: "बाजरा" },
  groundnut: { en: "groundnut", te: "వేరుశనగ", hi: "मूंगफली" },
  bengalGram: { en: "Bengal gram", te: "శనగ", hi: "चना" },
  redGram: { en: "red gram", te: "కంది", hi: "अरहर" },
  blackGram: { en: "black gram", te: "మినుము", hi: "उड़द" },
  greenGram: { en: "green gram", te: "పెసర", hi: "मूंग" },
  horseGram: { en: "horse gram", te: "ఉలవలు", hi: "कुलथी" },
  cotton: { en: "cotton", te: "పత్తి", hi: "कपास" },
  chilli: { en: "chilli", te: "మిర్చి", hi: "मिर्च" },
  sunflower: { en: "sunflower", te: "పొద్దుతిరుగుడు", hi: "सूरजमुखी" },
  sugarcane: { en: "sugarcane", te: "చెరకు", hi: "गन्ना" },
};

const KM = { en: "km", te: "కి.మీ.", hi: "कि.मी." };

export const TEXTS = {
  herdNear: {
    title: { en: "🐑 Herd near your field", te: "🐑 మీ పొలం దగ్గర మంద", hi: "🐑 आपके खेत के पास झुंड" },
    body: {
      en: "About {count} {animal} are {dist} away. Tap to chat.",
      te: "సుమారు {count} {animal} {dist} దూరంలో ఉన్నాయి. మాట్లాడటానికి నొక్కండి.",
      hi: "लगभग {count} {animal} {dist} दूर हैं। बात करने के लिए टैप करें।",
    },
  },
  residueNearSummary: {
    title: { en: "🌾 Crop residue near your herd", te: "🌾 మీ మంద దగ్గర పంట అవశేషాలు", hi: "🌾 आपके झुंड के पास फसल अवशेष" },
    body: {
      en: "{n} crop residue fields within {r} km: {crops}. Tap to see.",
      te: "{r} కి.మీ. లోపు {n} పంట అవశేషాల పొలాలు: {crops}. చూడటానికి నొక్కండి.",
      hi: "{r} कि.मी. के अंदर फसल अवशेष वाले {n} खेत: {crops}। देखने के लिए टैप करें।",
    },
  },
  residueNew: {
    title: { en: "🆕 New {crop} field {dist} from your herd", te: "🆕 మీ మంద నుంచి {dist} దూరంలో కొత్త {crop} పొలం", hi: "🆕 आपके झुंड से {dist} दूर नया {crop} खेत" },
    body: { en: "{acres} acres, {village}. Tap to see.", te: "{acres} ఎకరాలు, {village}. చూడటానికి నొక్కండి.", hi: "{acres} एकड़, {village}। देखने के लिए टैप करें।" },
  },
  nightStayWorkSummary: {
    title: { en: "💰 Night stay work near you", te: "💰 మీ దగ్గర మంద కట్టే పని", hi: "💰 आपके पास रात्रि ठहराव का काम" },
    body: {
      en: "{n} farmers within {r} km will pay for night stay. Tap to see.",
      te: "{r} కి.మీ. లోపు {n} రైతులు మంద కట్టడానికి డబ్బు ఇస్తారు. చూడటానికి నొక్కండి.",
      hi: "{r} कि.मी. के अंदर {n} किसान रात्रि ठहराव के लिए भुगतान करेंगे। देखने के लिए टैप करें।",
    },
  },
  nightStayWorkNew: {
    title: { en: "💰 Night stay work near you", te: "💰 మీ దగ్గర మంద కట్టే పని", hi: "💰 आपके पास रात्रि ठहराव का काम" },
    body: {
      en: "A farmer {dist} away needs a herd for {nights} nights. Tap to see.",
      te: "{dist} దూరంలో ఒక రైతుకు {nights} రాత్రులు మంద కావాలి. చూడటానికి నొక్కండి.",
      hi: "{dist} दूर एक किसान को {nights} रातों के लिए झुंड चाहिए। देखने के लिए टैप करें।",
    },
  },
  postContact: {
    title: { en: "✅ {name} is asking about your post", te: "✅ {name} మీ పోస్ట్ గురించి అడుగుతున్నారు", hi: "✅ {name} आपकी पोस्ट के बारे में पूछ रहे हैं" },
    body: { en: "{title}. Tap to reply.", te: "{title}. జవాబు ఇవ్వడానికి నొక్కండి.", hi: "{title}। जवाब देने के लिए टैप करें।" },
  },
  chat: {
    title: { en: "💬 {name}", te: "💬 {name}", hi: "💬 {name}" },
  },
  chatVoice: { en: "🎤 Voice message ({dur})", te: "🎤 వాయిస్ సందేశం ({dur})", hi: "🎤 वॉइस संदेश ({dur})" },
  chatPhoto: { en: "📷 Photo", te: "📷 ఫోటో", hi: "📷 फ़ोटो" },
  chatPhotos: { en: "📷 {n} photos", te: "📷 {n} ఫోటోలు", hi: "📷 {n} फ़ोटो" },
  reminder: {
    title: { en: "📍 Where is your herd today?", te: "📍 ఈ రోజు మీ మంద ఎక్కడ ఉంది?", hi: "📍 आज आपका झुंड कहाँ है?" },
    body: {
      en: "Tap to update your herd's location so nearby farmers can find you.",
      te: "దగ్గరి రైతులు మిమ్మల్ని కనుగొనేలా మంద లొకేషన్ అప్‌డేట్ చేయడానికి నొక్కండి.",
      hi: "पास के किसान आपको ढूँढ सकें, इसके लिए झुंड की लोकेशन अपडेट करने को टैप करें।",
    },
  },
  someone: { en: "Someone", te: "ఒకరు", hi: "कोई" },
};

export function langOf(l) {
  return LANGS.includes(l) ? l : "en";
}

export function fmt(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}

/** 0.4 -> "1 km" (never "0"), 3.24 -> "3 km", 12.6 -> "13 km" in the chosen language. */
export function distText(km, lang) {
  const n = Math.max(1, Math.round(km));
  return `${n} ${KM[langOf(lang)]}`;
}

export function cropText(post, lang, adminNames = {}) {
  const l = langOf(lang);
  const fromAdmin = adminNames[post.crop]?.[l] || adminNames[post.crop]?.en;
  return fromAdmin || CROPS[post.crop]?.[l] || post.cropOther || CROPS[post.crop]?.en || "";
}

export function animalText(type, lang) {
  return (ANIMALS[type] || ANIMALS.mixed)[langOf(lang)];
}

export function durText(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
