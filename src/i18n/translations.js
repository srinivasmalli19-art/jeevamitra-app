// Core UI translations. Keys are used everywhere via t('key').
// To add another language: copy the "en" block, translate every value,
// and add it under its language code below (e.g. "ta" for Tamil,
// "kn" for Kannada, "mr" for Marathi, "gu" for Gujarati).
//
// IMPORTANT: this translates the app's own buttons/labels/menus — it does
// NOT translate what people type (a land description, a symptom note).
// That would need a translation service (costs money / needs an API key),
// so a Telugu farmer's notes stay in Telugu no matter what language
// another user has their app set to.

export const LANGUAGES = [
  { code: "en", nativeName: "English", flag: "🇬🇧" },
  { code: "te", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", nativeName: "हिन्दी", flag: "🇮🇳" },
];

export const translations = {
  en: {
    // Bottom nav
    nav_lands: "Lands", nav_myLands: "My Lands", nav_bookings: "Bookings",
    nav_vets: "Vets", nav_alerts: "Alerts", nav_profile: "Profile",

    // Common actions
    save: "Save", cancel: "Cancel", submit: "Submit", back: "Back",
    call: "Call", whatsapp: "WhatsApp", directions: "Get directions",
    edit: "Edit", delete: "Delete", logout: "Log out", loading: "Loading...",

    // Onboarding / auth
    welcome_title: "Welcome to JeevaMitra",
    login_title: "Welcome back", signup_title: "Create your account",
    email: "Email", password: "Password", fullName: "Full name",
    login_button: "Log in", signup_button: "Create account",
    no_account: "New here?", have_account: "Already have an account?",

    // Lands
    lands_title: "Lands", lands_subtitle: "Marketplace",
    post_land: "Post new land", find_near_me: "Find lands near me",
    book_now: "Request booking", available: "Available", has_bookings: "Has bookings",

    // Bookings
    bookings_title: "Bookings", my_bookings: "My bookings", requests: "Requests",
    accept: "Accept", reject: "Reject",

    // Vets
    vets_title: "Vets", vets_subtitle: "Veterinary directory",

    // Alerts
    alerts_title: "Disease alerts", report_alert: "Report an alert",

    // Profile
    profile_title: "Profile", edit_profile: "Edit profile",
    profile_type: "Profile type", language: "Language",
  },

  te: {
    nav_lands: "భూములు", nav_myLands: "నా భూములు", nav_bookings: "బుకింగ్‌లు",
    nav_vets: "వైద్యులు", nav_alerts: "హెచ్చరికలు", nav_profile: "ప్రొఫైల్",

    save: "సేవ్ చేయండి", cancel: "రద్దు చేయండి", submit: "సమర్పించండి", back: "వెనుకకు",
    call: "కాల్ చేయండి", whatsapp: "వాట్సాప్", directions: "దిశలు చూపించు",
    edit: "మార్చు", delete: "తొలగించు", logout: "లాగ్ అవుట్", loading: "లోడ్ అవుతోంది...",

    welcome_title: "జీవమిత్రకు స్వాగతం",
    login_title: "తిరిగి స్వాగతం", signup_title: "మీ ఖాతాను సృష్టించండి",
    email: "ఇమెయిల్", password: "పాస్‌వర్డ్", fullName: "పూర్తి పేరు",
    login_button: "లాగిన్ చేయండి", signup_button: "ఖాతా సృష్టించండి",
    no_account: "కొత్తగా వచ్చారా?", have_account: "ఇప్పటికే ఖాతా ఉందా?",

    lands_title: "భూములు", lands_subtitle: "మార్కెట్‌ప్లేస్",
    post_land: "కొత్త భూమిని పోస్ట్ చేయండి", find_near_me: "నా దగ్గర భూములు వెతకండి",
    book_now: "బుకింగ్ కోరండి", available: "అందుబాటులో ఉంది", has_bookings: "బుకింగ్‌లు ఉన్నాయి",

    bookings_title: "బుకింగ్‌లు", my_bookings: "నా బుకింగ్‌లు", requests: "అభ్యర్థనలు",
    accept: "అంగీకరించు", reject: "తిరస్కరించు",

    vets_title: "వైద్యులు", vets_subtitle: "పశువైద్య డైరెక్టరీ",

    alerts_title: "వ్యాధి హెచ్చరికలు", report_alert: "హెచ్చరిక నివేదించండి",

    profile_title: "ప్రొఫైల్", edit_profile: "ప్రొఫైల్ మార్చండి",
    profile_type: "ప్రొఫైల్ రకం", language: "భాష",
  },

  hi: {
    nav_lands: "ज़मीनें", nav_myLands: "मेरी ज़मीनें", nav_bookings: "बुकिंग",
    nav_vets: "पशु चिकित्सक", nav_alerts: "चेतावनियाँ", nav_profile: "प्रोफ़ाइल",

    save: "सहेजें", cancel: "रद्द करें", submit: "जमा करें", back: "वापस",
    call: "कॉल करें", whatsapp: "व्हाट्सएप", directions: "दिशा-निर्देश दिखाएं",
    edit: "संपादित करें", delete: "हटाएं", logout: "लॉग आउट", loading: "लोड हो रहा है...",

    welcome_title: "जीवमित्र में आपका स्वागत है",
    login_title: "वापसी पर स्वागत है", signup_title: "अपना खाता बनाएं",
    email: "ईमेल", password: "पासवर्ड", fullName: "पूरा नाम",
    login_button: "लॉग इन करें", signup_button: "खाता बनाएं",
    no_account: "नए हैं?", have_account: "पहले से खाता है?",

    lands_title: "ज़मीनें", lands_subtitle: "मार्केटप्लेस",
    post_land: "नई ज़मीन पोस्ट करें", find_near_me: "मेरे पास ज़मीनें खोजें",
    book_now: "बुकिंग का अनुरोध करें", available: "उपलब्ध", has_bookings: "बुकिंग हैं",

    bookings_title: "बुकिंग", my_bookings: "मेरी बुकिंग", requests: "अनुरोध",
    accept: "स्वीकार करें", reject: "अस्वीकार करें",

    vets_title: "पशु चिकित्सक", vets_subtitle: "पशु चिकित्सा निर्देशिका",

    alerts_title: "रोग चेतावनियाँ", report_alert: "चेतावनी दर्ज करें",

    profile_title: "प्रोफ़ाइल", edit_profile: "प्रोफ़ाइल संपादित करें",
    profile_type: "प्रोफ़ाइल प्रकार", language: "भाषा",
  },
};
