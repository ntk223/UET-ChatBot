import * as Lucide from "lucide-react";

const emojiToIconKey = {
  "📝": "FileText",
  "💸": "Coins",
  "💰": "Coins",
  "📊": "BarChart3",
  "⚠️": "AlertTriangle",
  "💻": "Laptop",
  "🤖": "Bot",
  "🇬🇧": "Globe",
  "🏫": "School",
  "🧠": "Brain",
  "📚": "BookOpen",
  "🔄": "RefreshCw",
  "🔍": "Search",
  "❌": "XCircle",
  "💬": "MessageSquare",
  "📂": "FolderOpen",
  "🚀": "Rocket",
  "➡️": "SendHorizontal",
  "💡": "Lightbulb",
  "🟢": "Wifi",
  "🔴": "WifiOff",
  "🟡": "Loader2",
  "🎯": "Target",
  "🏠": "Home",
  "💼": "Briefcase",
  "🎓": "GraduationCap"
};

/**
 * Parses a string, extracts mapped emoji, strips it from the string,
 * and returns the cleaned text along with the Lucide React component.
 * 
 * @param {string} text 
 * @returns {{ cleanedText: string, Icon: React.ComponentType | null }}
 */
export function parseEmojiText(text) {
  if (typeof text !== "string") {
    return { cleanedText: text, Icon: null };
  }

  let cleanedText = text;
  let Icon = null;

  for (const [emoji, iconName] of Object.entries(emojiToIconKey)) {
    if (cleanedText.includes(emoji)) {
      cleanedText = cleanedText.replace(emoji, "").trim();
      Icon = Lucide[iconName] || null;
      break;
    }
  }

  // Clean up any double spaces
  cleanedText = cleanedText.replace(/\s+/g, " ").trim();

  return { cleanedText, Icon };
}
