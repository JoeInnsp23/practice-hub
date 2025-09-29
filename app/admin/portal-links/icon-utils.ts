import * as Icons from "lucide-react";
import { type LucideIcon } from "lucide-react";

// Get all icon names from Lucide
export const getAllIconNames = (): string[] => {
  return Object.keys(Icons).filter(
    (key) => {
      // Filter out non-icon exports
      if (["default", "icons", "aliases", "createLucideIcon", "LucideIcon", "Icon"].includes(key)) {
        return false;
      }
      // Check if it's a function (component)
      return typeof (Icons as any)[key] === "function";
    }
  ).sort();
};

// Icon aliases for better search
const iconAliases: Record<string, string[]> = {
  FileText: ["document", "paper", "page", "doc", "text", "note", "article"],
  File: ["document", "paper", "page", "blank"],
  Files: ["documents", "papers", "pages", "stack", "multiple"],
  FolderOpen: ["directory", "folder", "open", "expanded"],
  Folder: ["directory", "folder", "closed"],
  Save: ["save", "disk", "floppy", "store"],
  Download: ["save", "download", "export", "down"],
  Upload: ["upload", "import", "up"],
  Calendar: ["calendar", "date", "schedule", "appointment"],
  Clock: ["time", "clock", "watch", "timer"],
  Calculator: ["calc", "calculator", "math", "compute"],
  Building2: ["company", "office", "building", "corporate", "business"],
  Building: ["company", "office", "building", "structure"],
  Users: ["people", "users", "team", "group", "members"],
  User: ["person", "user", "profile", "account", "member"],
  UserCheck: ["approved", "verified", "user", "person"],
  Mail: ["email", "mail", "message", "envelope", "letter"],
  MessageSquare: ["chat", "message", "comment", "discussion", "conversation"],
  Phone: ["call", "phone", "telephone", "contact"],
  Globe: ["world", "globe", "internet", "web", "global", "earth"],
  Home: ["house", "home", "dashboard", "main"],
  Settings: ["config", "settings", "options", "preferences", "gear", "cog"],
  Search: ["find", "search", "lookup", "magnify"],
  Filter: ["filter", "sort", "refine", "sieve"],
  Database: ["db", "database", "storage", "data"],
  Server: ["server", "backend", "host", "machine"],
  Shield: ["security", "shield", "protection", "safety", "secure"],
  Lock: ["lock", "secure", "password", "locked", "private"],
  Key: ["key", "password", "access", "unlock", "auth"],
  CreditCard: ["payment", "card", "credit", "debit", "pay"],
  DollarSign: ["money", "dollar", "cash", "currency", "usd", "price"],
  PoundSterling: ["pound", "gbp", "sterling", "money", "currency"],
  Euro: ["euro", "eur", "money", "currency"],
  Receipt: ["receipt", "invoice", "bill", "statement"],
  ShoppingCart: ["cart", "shop", "shopping", "basket", "purchase"],
  Package: ["package", "box", "parcel", "delivery", "product"],
  Truck: ["delivery", "truck", "shipping", "transport"],
  BarChart: ["chart", "graph", "analytics", "statistics", "bar"],
  PieChart: ["chart", "graph", "analytics", "statistics", "pie"],
  TrendingUp: ["growth", "increase", "up", "trend", "profit"],
  TrendingDown: ["decrease", "down", "trend", "loss", "decline"],
  Check: ["done", "check", "tick", "complete", "success", "yes"],
  X: ["close", "cancel", "delete", "remove", "no", "cross"],
  Plus: ["add", "plus", "new", "create"],
  Minus: ["subtract", "minus", "remove", "delete"],
  Edit: ["edit", "pencil", "modify", "change", "write"],
  Trash2: ["delete", "trash", "bin", "remove", "garbage"],
  Eye: ["view", "see", "show", "visible", "eye"],
  EyeOff: ["hide", "invisible", "hidden", "private"],
  Heart: ["love", "heart", "favorite", "like"],
  Star: ["star", "favorite", "bookmark", "rate", "rating"],
  Bell: ["notification", "bell", "alert", "reminder", "alarm"],
  AlertCircle: ["warning", "alert", "attention", "important", "info"],
  HelpCircle: ["help", "question", "support", "info", "faq"],
  Info: ["info", "information", "about", "details"],
  CheckCircle: ["success", "done", "complete", "verified", "approved"],
  XCircle: ["error", "failed", "wrong", "denied", "rejected"],
  ArrowRight: ["next", "forward", "right", "arrow", "continue"],
  ArrowLeft: ["back", "previous", "left", "arrow", "return"],
  ArrowUp: ["up", "upload", "top", "arrow", "increase"],
  ArrowDown: ["down", "download", "bottom", "arrow", "decrease"],
  ChevronRight: ["next", "expand", "right", "chevron"],
  ChevronLeft: ["back", "collapse", "left", "chevron"],
  ChevronUp: ["up", "expand", "top", "chevron"],
  ChevronDown: ["down", "collapse", "bottom", "chevron"],
  ExternalLink: ["external", "link", "open", "new", "tab", "window"],
  Link: ["link", "chain", "url", "connection"],
  Copy: ["copy", "duplicate", "clone", "paste"],
  Clipboard: ["clipboard", "paste", "copy"],
  Share2: ["share", "social", "send", "forward"],
  Send: ["send", "submit", "mail", "message", "plane"],
  Briefcase: ["work", "job", "business", "briefcase", "portfolio"],
  Award: ["award", "prize", "achievement", "medal", "certificate"],
  Trophy: ["trophy", "winner", "champion", "first", "prize"],
  Target: ["target", "goal", "aim", "objective", "bullseye"],
  Flag: ["flag", "marker", "important", "milestone"],
  MapPin: ["location", "pin", "map", "place", "address"],
  Navigation: ["navigate", "navigation", "gps", "direction"],
  Compass: ["compass", "direction", "navigate", "orientation"],
  Map: ["map", "location", "geography", "atlas"],
  Activity: ["activity", "pulse", "heartbeat", "monitor"],
  Wifi: ["wifi", "wireless", "internet", "connection", "network"],
  Zap: ["fast", "lightning", "quick", "energy", "power"],
  Battery: ["battery", "power", "charge", "energy"],
  Cloud: ["cloud", "storage", "online", "sync"],
  HardDrive: ["storage", "disk", "drive", "memory", "hdd"],
  Cpu: ["processor", "cpu", "chip", "computer", "performance"],
  Monitor: ["monitor", "screen", "display", "desktop"],
  Smartphone: ["phone", "mobile", "smartphone", "device"],
  Tablet: ["tablet", "ipad", "device", "screen"],
  Laptop: ["laptop", "computer", "notebook", "pc"],
  Printer: ["print", "printer", "paper", "document"],
  Camera: ["camera", "photo", "picture", "image"],
  Image: ["image", "picture", "photo", "gallery"],
  Video: ["video", "movie", "film", "play", "media"],
  Music: ["music", "audio", "sound", "note", "song"],
  Mic: ["microphone", "mic", "record", "voice", "audio"],
  Volume2: ["volume", "sound", "audio", "speaker", "loud"],
  VolumeX: ["mute", "silent", "no sound", "quiet"],
  PlayCircle: ["play", "start", "video", "media", "run"],
  PauseCircle: ["pause", "stop", "wait", "hold"],
  StopCircle: ["stop", "end", "finish", "terminate"],
  SkipForward: ["next", "skip", "forward", "fast forward"],
  SkipBack: ["previous", "skip", "back", "rewind"],
  RefreshCw: ["refresh", "reload", "sync", "update", "rotate"],
  RotateCw: ["rotate", "turn", "clockwise", "spin"],
  GitBranch: ["branch", "git", "version", "fork"],
  GitCommit: ["commit", "git", "save", "version"],
  GitMerge: ["merge", "git", "combine", "join"],
  GitPullRequest: ["pull request", "pr", "git", "review"],
  Github: ["github", "git", "code", "repository"],
  Code: ["code", "programming", "development", "brackets"],
  Terminal: ["terminal", "console", "command", "cli"],
  Layers: ["layers", "stack", "levels", "hierarchy"],
  Layout: ["layout", "template", "grid", "structure"],
  Grid: ["grid", "layout", "table", "matrix"],
  List: ["list", "items", "menu", "options"],
  AlignLeft: ["align", "left", "text", "format"],
  AlignCenter: ["align", "center", "text", "format"],
  AlignRight: ["align", "right", "text", "format"],
  Bold: ["bold", "strong", "text", "format"],
  Italic: ["italic", "emphasis", "text", "format"],
  Underline: ["underline", "text", "format"],
  Type: ["text", "type", "font", "typography"],
};

// Fuzzy search function
export const fuzzySearchIcons = (query: string, allIconNames: string[]): string[] => {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase().trim();
  const results = new Map<string, number>();

  allIconNames.forEach(iconName => {
    let score = 0;
    const lowerIconName = iconName.toLowerCase();

    // Exact match
    if (lowerIconName === searchTerm) {
      score = 100;
    }
    // Starts with
    else if (lowerIconName.startsWith(searchTerm)) {
      score = 90;
    }
    // Contains
    else if (lowerIconName.includes(searchTerm)) {
      score = 70;
    }
    // Split PascalCase and check each word
    else {
      const words = iconName.split(/(?=[A-Z])/).map(w => w.toLowerCase());
      if (words.some(w => w.startsWith(searchTerm))) {
        score = 60;
      } else if (words.some(w => w.includes(searchTerm))) {
        score = 50;
      }
    }

    // Check aliases
    const aliases = iconAliases[iconName] || [];
    if (aliases.some(alias => alias === searchTerm)) {
      score = Math.max(score, 95);
    } else if (aliases.some(alias => alias.startsWith(searchTerm))) {
      score = Math.max(score, 85);
    } else if (aliases.some(alias => alias.includes(searchTerm))) {
      score = Math.max(score, 65);
    }

    // Fuzzy match (simple character matching)
    if (score === 0) {
      let fuzzyScore = 0;
      let searchIndex = 0;
      for (let i = 0; i < lowerIconName.length && searchIndex < searchTerm.length; i++) {
        if (lowerIconName[i] === searchTerm[searchIndex]) {
          fuzzyScore += (searchIndex === 0 && i === 0) ? 10 : 5;
          searchIndex++;
        }
      }
      if (searchIndex === searchTerm.length) {
        score = Math.max(score, fuzzyScore);
      }
    }

    if (score > 0) {
      results.set(iconName, score);
    }
  });

  // Sort by score and return
  return Array.from(results.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
};

// Get icon component dynamically
export const getIconComponent = (name: string): LucideIcon | null => {
  return (Icons as any)[name] || null;
};

// Common/popular icons for quick access
export const getCommonIconNames = (): string[] => {
  return [
    "FileText", "File", "Folder", "FolderOpen",
    "Save", "Download", "Upload", "Share2",
    "Calendar", "Clock", "Bell", "Mail",
    "User", "Users", "UserCheck", "Building2",
    "Home", "Settings", "Search", "Filter",
    "Database", "Server", "Shield", "Lock",
    "CreditCard", "DollarSign", "Receipt", "ShoppingCart",
    "BarChart", "PieChart", "TrendingUp", "Activity",
    "Check", "X", "Plus", "Minus",
    "Edit", "Trash2", "Copy", "Clipboard",
    "Eye", "EyeOff", "Heart", "Star",
    "AlertCircle", "HelpCircle", "Info", "CheckCircle",
    "ArrowRight", "ArrowLeft", "ChevronDown", "ChevronRight",
    "ExternalLink", "Link", "Globe", "Map",
    "Phone", "MessageSquare", "Send", "Wifi",
    "Github", "Code", "Terminal", "Layers"
  ];
};