/**
 * AI RAMU Trilingual Engine (English, Hindi, Bengali)
 * Bolo Ramu, Kaam Shuru.
 */

export type SupportedLanguage = "en" | "hi" | "bn";

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  supportingMessage: string;
  welcomeHeading: string;
  welcomeSub: string;
  inputPlaceholder: string;
  btnSend: string;
  btnApprove: string;
  btnReject: string;
  btnCancel: string;
  statusReady: string;
  statusThinking: string;
  statusExecuting: string;
  statusWaitingApproval: string;
  statusCompleted: string;
  statusFailed: string;
  tabChat: string;
  tabTasks: string;
  tabAutomations: string;
  tabConnectors: string;
  tabMemory: string;
  tabSettings: string;
  securitySandboxAlert: string;
  destructiveActionWarning: string;
  memoryCleared: string;
  systemPromptGreeting: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: "AI RAMU",
    tagline: "Bolo Ramu, Kaam Shuru.",
    supportingMessage: "Your Indian AI Worker. Ready to Get Things Done.",
    welcomeHeading: "Hello! I am AI Ramu.",
    welcomeSub: "Tell me what task needs to be completed, or select an automation below.",
    inputPlaceholder: "Bolo Ramu... (e.g. 'Organize my downloads', 'Create a sales invoice', 'Draft an email')",
    btnSend: "Send Task",
    btnApprove: "Approve Action",
    btnReject: "Reject",
    btnCancel: "Cancel Task",
    statusReady: "Ready for orders",
    statusThinking: "Thinking...",
    statusExecuting: "Executing task...",
    statusWaitingApproval: "Awaiting your approval",
    statusCompleted: "Task completed successfully",
    statusFailed: "Task encountered an error",
    tabChat: "Chat & Workspace",
    tabTasks: "Task Execution",
    tabAutomations: "Automations",
    tabConnectors: "Integrations",
    tabMemory: "Memory & Privacy",
    tabSettings: "Settings",
    securitySandboxAlert: "Action restricted by AI Ramu Security Sandbox.",
    destructiveActionWarning: "This action will modify or delete data. Your confirmation is required.",
    memoryCleared: "AI Ramu memory wiped clean.",
    systemPromptGreeting: "You are AI Ramu, an approachable, highly capable Indian AI Worker and desktop automation agent. Your motto is 'Bolo Ramu, Kaam Shuru.' You speak English, Hindi, and Bengali fluently. You take initiative, execute digital tasks safely, verify results, and always prioritize the user's security."
  },
  hi: {
    appName: "AI RAMU",
    tagline: "बोलो रामू, काम शुरू।",
    supportingMessage: "आपका भारतीय AI कार्यकर्ता। काम निपटाने के लिए तैयार।",
    welcomeHeading: "नमस्ते! मैं हूँ AI Ramu।",
    welcomeSub: "बताइए क्या काम करना है, या नीचे दिए गए ऑटोमेशन में से चुनें।",
    inputPlaceholder: "बोलो रामू... (जैसे: 'डाउनलोड्स फ़ोल्डर व्यवस्थित करो', 'बिल बनाओ', 'ईमेल लिखो')",
    btnSend: "काम शुरू करें",
    btnApprove: "मंजूरी दें",
    btnReject: "अस्वीकार करें",
    btnCancel: "रद्द करें",
    statusReady: "आदेश के लिए तैयार",
    statusThinking: "विचार कर रहा हूँ...",
    statusExecuting: "कार्य प्रगति पर है...",
    statusWaitingApproval: "आपकी स्वीकृति की प्रतीक्षा है",
    statusCompleted: "कार्य सफलतापूर्वक संपन्न हुआ",
    statusFailed: "कार्य में त्रुटि आई",
    tabChat: "बातचीत व कार्यक्षेत्र",
    tabTasks: "कार्य निष्पादन",
    tabAutomations: "ऑटोमेशन",
    tabConnectors: "कनेक्टर्स",
    tabMemory: "मेमोरी व गोपनीयता",
    tabSettings: "सेटिंग्स",
    securitySandboxAlert: "यह क्रिया AI Ramu सुरक्षा सैंडबॉक्स द्वारा प्रतिबंधित है।",
    destructiveActionWarning: "यह क्रिया डेटा बदल या हटा सकती है। आपकी पुष्टि अनिवार्य है।",
    memoryCleared: "AI Ramu की मेमोरी साफ़ कर दी गई।",
    systemPromptGreeting: "आप AI Ramu हैं, एक विनम्र, अत्यंत सक्षम भारतीय AI कार्यकर्ता और डेस्कटॉप ऑटोमेशन एजेंट। आपका ध्येय वाक्य है 'बोलो रामू, काम शुरू।' आप हिंदी, बंगाली और अंग्रेजी सहजता से बोलते हैं। आप डिजिटल कार्य सुरक्षित रूप से पूरा करते हैं और उपयोगकर्ता की सुरक्षा को सर्वोच्च प्राथमिकता देते हैं।"
  },
  bn: {
    appName: "AI RAMU",
    tagline: "বলুন রামু, কাজ শুরু।",
    supportingMessage: "আপনার ভারতীয় এআই কর্মী। ডিজিটাল কাজ সম্পন্ন করতে প্রস্তুত।",
    welcomeHeading: "নমস্কার! আমি AI Ramu।",
    welcomeSub: "বলুন কি কাজ করতে হবে, অথবা নিচের যেকোনো অটোমেশন বেছে নিন।",
    inputPlaceholder: "বলুন রামু... (যেমন: 'ডাউনলোড ফোল্ডার সাজিয়ে দাও', 'ইনভয়েস তৈরি করো', 'ইমেইল খসড়া করো')",
    btnSend: "কাজ শুরু করুন",
    btnApprove: "অনুমোদন দিন",
    btnReject: "বাতিল করুন",
    btnCancel: "কাজ থামান",
    statusReady: "কাজের জন্য প্রস্তুত",
    statusThinking: "ভাবছি...",
    statusExecuting: "কাজ সম্পাদন করা হচ্ছে...",
    statusWaitingApproval: "আপনার অনুমোদনের অপেক্ষায়",
    statusCompleted: "কাজ সফলভাবে সম্পন্ন হয়েছে",
    statusFailed: "কাজে ত্রুটি দেখা দিয়েছে",
    tabChat: "চ্যাট ও ওয়ার্কস্পেস",
    tabTasks: "টাস্ক ড্যাশবোর্ড",
    tabAutomations: "অটোমেশন",
    tabConnectors: "কানেক্টরস",
    tabMemory: "স্মৃতি ও গোপনীয়তা",
    tabSettings: "সেটিংস",
    securitySandboxAlert: "এই কাজটি AI Ramu সিকিউরিটি স্যান্ডবক্স দ্বারা সীমাবদ্ধ।",
    destructiveActionWarning: "এই কাজটি ফাইল বা ডেটা পরিবর্তন/মুছে ফেলতে পারে। আপনার অনুমোদন প্রয়োজন।",
    memoryCleared: "AI Ramu-এর মেমোরি সম্পূর্ণ মুছে ফেলা হয়েছে।",
    systemPromptGreeting: "আপনি AI Ramu, একজন বিনয়ী, দক্ষ ভারতীয় এআই কর্মী ও ডেস্কটপ অটোমেশন সহকারী। আপনার মূলমন্ত্র 'বলুন রামু, কাজ শুরু।' আপনি বাংলা, হিন্দি ও ইংরেজি অত্যন্ত সাবলীলভাবে বলতে পারেন। ডিজিটাল কাজকর্ম নির্ভুলভাবে সম্পন্ন করাই আপনার লক্ষ্য।"
  }
};

/**
 * Detect language from text (Hindi Devanagari script, Bengali script, or default to English)
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn";
  }
  return "en";
}

export function getTranslation(lang: SupportedLanguage = "en"): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
