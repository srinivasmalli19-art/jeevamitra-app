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
  { code: "en", nativeName: "English" },
  { code: "te", nativeName: "తెలుగు" },
  { code: "hi", nativeName: "हिन्दी" },
];

export const translations = {
  en: {
    // Bottom nav
    nav_home: "Home",
    nav_lands: "Lands", nav_myLands: "My Lands", nav_bookings: "Bookings",
    nav_vets: "Vets", nav_alerts: "Alerts", nav_profile: "Profile",

    // Common actions
    save: "Save", cancel: "Cancel", submit: "Submit", back: "Back",
    call: "Call", whatsapp: "WhatsApp", directions: "Get directions",
    edit: "Edit", delete: "Delete", logout: "Log out", loading: "Loading...",

    // Onboarding / auth
    welcome_title: "Welcome to JeevaMitra",
    login_title: "Welcome back", signup_title: "Create your account",
    email: "Email", password: "Password", fullName: "Full name", phone: "Phone number",
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
    profile_alerts_link: "Disease alerts",
    profile_livestock_link: "My livestock", profile_landHoldings_link: "My land holdings",
    profile_stories_link: "Success stories", profile_videos_link: "Videos",

    // Home dashboard
    home_stat_nearbyLands: "Nearby lands available", home_stat_myLands: "Lands you've posted",
    home_stat_activeBookings: "Active bookings", home_stat_nearbyVets: "Vets nearby",
    home_stat_diseaseAlerts: "Active high-severity alerts", home_stat_bookingRequests: "Booking requests waiting",
    home_qa_postLand: "Post land", home_qa_findLand: "Find land",
    home_qa_findVet: "Find vet", home_qa_reportAlert: "Report alert",
    home_nearbyLands_title: "Nearby lands", home_alerts_title: "Disease alerts near you",
    home_yourBookings_title: "Bookings you made", home_yourPostedLands_title: "Lands you posted",
    see_all: "See all",

    // Map
    map_title: "Map", map_subtitle: "Unified view",
    map_caption: "Lands, vets and alerts near you, plotted together.",

    // Settings sheet
    settings_title: "Settings", settings_language: "Language", settings_notifications: "Notifications",
    settings_units: "Units (acres / km)", settings_logout: "Log out",
    delete_account: "Delete account", delete_account_confirm_toast: "Account deletion needs confirmation",

    // Notifications sheet
    notifications_title: "Notifications", mark_all_read: "Mark all as read",
    no_notifications_title: "No notifications yet",
    no_notifications_body: "You'll see updates here when someone acts on your bookings.",

    // Messaging
    nav_messages: "Messages",
    messages_title: "Messages",
    msg_contact_publisher: "Contact publisher",
    msg_about_publication: "About publication",
    msg_publication: "Publication",
    msg_view_publication: "View publication",
    msg_participant: "Conversation",
    msg_publisher: "Publisher",
    msg_no_messages_yet: "No messages yet",
    msg_empty_title: "No conversations yet",
    msg_empty_body: "Open a land listing and tap “Contact publisher” to start chatting.",
    msg_error_title: "Couldn't load messages",
    msg_error_body: "Something went wrong. Please try again.",
    msg_offline_banner: "You're offline. Messages will sync when you reconnect.",
    msg_refresh: "Refresh",
    msg_retry: "Retry",
    msg_send: "Send",
    msg_send_failed: "Message failed to send.",
    msg_type_message: "Type a message…",
    msg_load_older: "Load older messages",
    msg_start_conversation: "Say hello to start the conversation.",
    msg_unavailable_title: "Conversation unavailable",
    msg_unavailable_body: "This conversation doesn't exist or you don't have access to it.",
  },

  te: {
    nav_home: "హోమ్",
    nav_lands: "భూములు", nav_myLands: "నా భూములు", nav_bookings: "బుకింగ్‌లు",
    nav_vets: "వైద్యులు", nav_alerts: "హెచ్చరికలు", nav_profile: "ప్రొఫైల్",

    save: "సేవ్ చేయండి", cancel: "రద్దు చేయండి", submit: "సమర్పించండి", back: "వెనుకకు",
    call: "కాల్ చేయండి", whatsapp: "వాట్సాప్", directions: "దిశలు చూపించు",
    edit: "మార్చు", delete: "తొలగించు", logout: "లాగ్ అవుట్", loading: "లోడ్ అవుతోంది...",

    welcome_title: "జీవమిత్రకు స్వాగతం",
    login_title: "తిరిగి స్వాగతం", signup_title: "మీ ఖాతాను సృష్టించండి",
    email: "ఇమెయిల్", password: "పాస్‌వర్డ్", fullName: "పూర్తి పేరు", phone: "ఫోన్ నంబర్",
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
    profile_alerts_link: "వ్యాధి హెచ్చరికలు",
    profile_livestock_link: "నా పశువులు", profile_landHoldings_link: "నా భూ రికార్డులు",
    profile_stories_link: "విజయ గాథలు", profile_videos_link: "వీడియోలు",

    home_stat_nearbyLands: "సమీపంలో అందుబాటులో ఉన్న భూములు", home_stat_myLands: "మీరు పోస్ట్ చేసిన భూములు",
    home_stat_activeBookings: "సక్రియ బుకింగ్‌లు", home_stat_nearbyVets: "సమీప వైద్యులు",
    home_stat_diseaseAlerts: "అధిక తీవ్రత హెచ్చరికలు", home_stat_bookingRequests: "వేచి ఉన్న బుకింగ్ అభ్యర్థనలు",
    home_qa_postLand: "భూమి పోస్ట్ చేయండి", home_qa_findLand: "భూమి వెతకండి",
    home_qa_findVet: "వైద్యుడిని వెతకండి", home_qa_reportAlert: "హెచ్చరిక నివేదించండి",
    home_nearbyLands_title: "సమీప భూములు", home_alerts_title: "మీ సమీపంలో వ్యాధి హెచ్చరికలు",
    home_yourBookings_title: "మీరు చేసిన బుకింగ్‌లు", home_yourPostedLands_title: "మీరు పోస్ట్ చేసిన భూములు",
    see_all: "అన్నీ చూడండి",

    map_title: "మ్యాప్", map_subtitle: "సమీకృత వీక్షణ",
    map_caption: "మీ సమీపంలోని భూములు, వైద్యులు మరియు హెచ్చరికలు కలిపి చూపబడ్డాయి.",

    settings_title: "సెట్టింగ్‌లు", settings_language: "భాష", settings_notifications: "నోటిఫికేషన్‌లు",
    settings_units: "యూనిట్లు (ఎకరాలు / కి.మీ.)", settings_logout: "లాగ్ అవుట్",
    delete_account: "ఖాతాను తొలగించండి", delete_account_confirm_toast: "ఖాతా తొలగింపుకు నిర్ధారణ అవసరం",

    notifications_title: "నోటిఫికేషన్‌లు", mark_all_read: "అన్నీ చదివినట్లు గుర్తించండి",
    no_notifications_title: "ఇంకా నోటిఫికేషన్‌లు లేవు",
    no_notifications_body: "మీ బుకింగ్‌లపై ఎవరైనా చర్య తీసుకున్నప్పుడు అప్‌డేట్‌లు ఇక్కడ కనిపిస్తాయి.",

    // Messaging
    nav_messages: "సందేశాలు",
    messages_title: "సందేశాలు",
    msg_contact_publisher: "పోస్ట్ చేసినవారిని సంప్రదించండి",
    msg_about_publication: "పోస్ట్ గురించి",
    msg_publication: "పోస్ట్",
    msg_view_publication: "పోస్ట్‌ను చూడండి",
    msg_participant: "సంభాషణ",
    msg_publisher: "పోస్ట్ చేసినవారు",
    msg_no_messages_yet: "ఇంకా సందేశాలు లేవు",
    msg_empty_title: "ఇంకా సంభాషణలు లేవు",
    msg_empty_body: "ఒక భూమి లిస్టింగ్ తెరిచి, చాట్ ప్రారంభించడానికి “పోస్ట్ చేసినవారిని సంప్రదించండి” నొక్కండి.",
    msg_error_title: "సందేశాలు లోడ్ చేయడం విఫలమైంది",
    msg_error_body: "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    msg_offline_banner: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. తిరిగి కనెక్ట్ అయినప్పుడు సందేశాలు సింక్ అవుతాయి.",
    msg_refresh: "రిఫ్రెష్",
    msg_retry: "మళ్లీ ప్రయత్నించండి",
    msg_send: "పంపండి",
    msg_send_failed: "సందేశం పంపడం విఫలమైంది.",
    msg_type_message: "సందేశం టైప్ చేయండి…",
    msg_load_older: "పాత సందేశాలను లోడ్ చేయండి",
    msg_start_conversation: "సంభాషణ ప్రారంభించడానికి హలో చెప్పండి.",
    msg_unavailable_title: "సంభాషణ అందుబాటులో లేదు",
    msg_unavailable_body: "ఈ సంభాషణ లేదు లేదా మీకు దానికి ప్రాప్యత లేదు.",
  },

  hi: {
    nav_home: "होम",
    nav_lands: "ज़मीनें", nav_myLands: "मेरी ज़मीनें", nav_bookings: "बुकिंग",
    nav_vets: "पशु चिकित्सक", nav_alerts: "चेतावनियाँ", nav_profile: "प्रोफ़ाइल",

    save: "सहेजें", cancel: "रद्द करें", submit: "जमा करें", back: "वापस",
    call: "कॉल करें", whatsapp: "व्हाट्सएप", directions: "दिशा-निर्देश दिखाएं",
    edit: "संपादित करें", delete: "हटाएं", logout: "लॉग आउट", loading: "लोड हो रहा है...",

    welcome_title: "जीवमित्र में आपका स्वागत है",
    login_title: "वापसी पर स्वागत है", signup_title: "अपना खाता बनाएं",
    email: "ईमेल", password: "पासवर्ड", fullName: "पूरा नाम", phone: "फ़ोन नंबर",
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
    profile_alerts_link: "रोग चेतावनियाँ",
    profile_livestock_link: "मेरे पशुधन", profile_landHoldings_link: "मेरी भूमि रिकॉर्ड",
    profile_stories_link: "सफलता की कहानियाँ", profile_videos_link: "वीडियो",

    home_stat_nearbyLands: "नज़दीक उपलब्ध ज़मीनें", home_stat_myLands: "आपकी पोस्ट की गई ज़मीनें",
    home_stat_activeBookings: "सक्रिय बुकिंग", home_stat_nearbyVets: "नज़दीकी पशु चिकित्सक",
    home_stat_diseaseAlerts: "उच्च गंभीरता वाली चेतावनियाँ", home_stat_bookingRequests: "लंबित बुकिंग अनुरोध",
    home_qa_postLand: "ज़मीन पोस्ट करें", home_qa_findLand: "ज़मीन खोजें",
    home_qa_findVet: "पशु चिकित्सक खोजें", home_qa_reportAlert: "चेतावनी दर्ज करें",
    home_nearbyLands_title: "नज़दीकी ज़मीनें", home_alerts_title: "आपके नज़दीक रोग चेतावनियाँ",
    home_yourBookings_title: "आपकी की गई बुकिंग", home_yourPostedLands_title: "आपकी पोस्ट की गई ज़मीनें",
    see_all: "सभी देखें",

    map_title: "मानचित्र", map_subtitle: "एकीकृत दृश्य",
    map_caption: "आपके आस-पास की ज़मीनें, पशु चिकित्सक और चेतावनियाँ एक साथ दिखाई गई हैं।",

    settings_title: "सेटिंग्स", settings_language: "भाषा", settings_notifications: "सूचनाएं",
    settings_units: "इकाइयाँ (एकड़ / कि.मी.)", settings_logout: "लॉग आउट",
    delete_account: "खाता हटाएं", delete_account_confirm_toast: "खाता हटाने के लिए पुष्टि आवश्यक है",

    notifications_title: "सूचनाएं", mark_all_read: "सभी को पढ़ा हुआ चिह्नित करें",
    no_notifications_title: "अभी तक कोई सूचना नहीं",
    no_notifications_body: "जब कोई आपकी बुकिंग पर कार्रवाई करेगा, तो अपडेट यहां दिखाई देंगे।",

    // Messaging
    nav_messages: "संदेश",
    messages_title: "संदेश",
    msg_contact_publisher: "प्रकाशक से संपर्क करें",
    msg_about_publication: "पोस्ट के बारे में",
    msg_publication: "पोस्ट",
    msg_view_publication: "पोस्ट देखें",
    msg_participant: "बातचीत",
    msg_publisher: "प्रकाशक",
    msg_no_messages_yet: "अभी तक कोई संदेश नहीं",
    msg_empty_title: "अभी तक कोई बातचीत नहीं",
    msg_empty_body: "कोई ज़मीन लिस्टिंग खोलें और चैट शुरू करने के लिए “प्रकाशक से संपर्क करें” पर टैप करें।",
    msg_error_title: "संदेश लोड नहीं हो सके",
    msg_error_body: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    msg_offline_banner: "आप ऑफ़लाइन हैं। पुनः कनेक्ट होने पर संदेश सिंक होंगे।",
    msg_refresh: "रिफ्रेश करें",
    msg_retry: "पुनः प्रयास करें",
    msg_send: "भेजें",
    msg_send_failed: "संदेश भेजने में विफल।",
    msg_type_message: "संदेश लिखें…",
    msg_load_older: "पुराने संदेश लोड करें",
    msg_start_conversation: "बातचीत शुरू करने के लिए नमस्ते कहें।",
    msg_unavailable_title: "बातचीत उपलब्ध नहीं",
    msg_unavailable_body: "यह बातचीत मौजूद नहीं है या आपके पास इसकी पहुँच नहीं है।",
  },
};
