// Explicit imports required - wildcard imports don't work with Next.js/Turbopack
import {
  type LucideIcon,
  FileText,
  File,
  Files,
  Folder,
  FolderOpen,
  Save,
  Download,
  Upload,
  Calendar,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  Home,
  Settings,
  Search,
  Filter,
  Database,
  Server,
  Shield,
  Lock,
  Key,
  CreditCard,
  DollarSign,
  PoundSterling,
  Euro,
  Receipt,
  ShoppingCart,
  Package,
  Truck,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  Star,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Link,
  Copy,
  Clipboard,
  Share2,
  Send,
  User,
  Users,
  UserCheck,
  Building,
  Building2,
  Calculator,
  Activity,
  Wifi,
  Code,
  Terminal,
  Layers,
  Map as MapIcon,
  MapPin,
  Navigation,
  Compass,
  Grid,
  List,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Circle,
  Square,
  Triangle,
  Zap,
  Cloud,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Wind,
  BookOpen,
  Book,
  Bookmark,
  Archive,
  Inbox,
  Briefcase,
  Award,
  Gift,
  Target,
  Flag,
  Tag,
  Tags,
  Hash,
  Camera,
  Image,
  Film,
  Video,
  Music,
  Mic,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  HardDrive,
  Cpu,
  Printer,
  Paperclip,
  Scissors,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Columns,
  Layout,
  Sidebar,
  PanelLeft,
  PanelRight,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  UserX,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Github,
  Gitlab,
  Chrome,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Twitch,
  Slack,
  Battery,
  BatteryCharging,
  Bluetooth,
  Airplay,
  Cast,
  Voicemail,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  MessageCircle,
  MessagesSquare,
  FileSpreadsheet,
  FileCode,
  FileJson,
  FilePlus,
  FolderPlus,
  FolderMinus,
  FolderX,
  Gauge,
  BarChart2,
  BarChart3,
  LineChart,
  Percent,
  Wallet,
  ShoppingBag,
  Rocket,
  Plane,
  Car,
  Bus,
  Train,
} from "lucide-react";

// Pre-compute all icon data at module load time
class IconIndex {
  private iconNames: string[] = [];
  private iconComponents = new Map<string, LucideIcon>();
  private searchIndex = new Map<string, Set<string>>();
  private aliasMap = new Map<string, Set<string>>();
  private initialized = false;

  // Icon aliases for semantic search
  private readonly aliases: Record<string, string[]> = {
    FileText: [
      "document",
      "paper",
      "page",
      "doc",
      "text",
      "note",
      "article",
      "report",
    ],
    File: ["document", "paper", "page", "blank", "empty"],
    Files: ["documents", "papers", "pages", "stack", "multiple", "batch"],
    Folder: ["directory", "folder", "closed", "container"],
    FolderOpen: ["directory", "folder", "open", "expanded", "browse"],
    Save: ["save", "disk", "floppy", "store", "persist"],
    Download: ["save", "download", "export", "down", "get"],
    Upload: ["upload", "import", "up", "send", "push"],
    Calendar: ["calendar", "date", "schedule", "appointment", "event", "diary"],
    Clock: ["time", "clock", "watch", "timer", "hour", "minute"],
    Calculator: ["calc", "calculator", "math", "compute", "numbers"],
    Building2: [
      "company",
      "office",
      "building",
      "corporate",
      "business",
      "enterprise",
    ],
    Building: ["company", "office", "building", "structure", "premises"],
    Users: [
      "people",
      "users",
      "team",
      "group",
      "members",
      "staff",
      "employees",
    ],
    User: ["person", "user", "profile", "account", "member", "individual"],
    UserCheck: ["approved", "verified", "user", "person", "authorized"],
    Mail: ["email", "mail", "message", "envelope", "letter", "inbox"],
    MessageSquare: [
      "chat",
      "message",
      "comment",
      "discussion",
      "conversation",
      "talk",
    ],
    Phone: ["call", "phone", "telephone", "contact", "ring", "dial"],
    Globe: ["world", "globe", "internet", "web", "global", "earth", "www"],
    Home: ["house", "home", "dashboard", "main", "start", "index"],
    Settings: [
      "config",
      "settings",
      "options",
      "preferences",
      "gear",
      "cog",
      "configure",
    ],
    Search: ["find", "search", "lookup", "magnify", "seek", "query"],
    Filter: ["filter", "sort", "refine", "sieve", "narrow"],
    Database: ["db", "database", "storage", "data", "records", "sql"],
    Server: ["server", "backend", "host", "machine", "api"],
    Shield: ["security", "shield", "protection", "safety", "secure", "guard"],
    Lock: ["lock", "secure", "password", "locked", "private", "protected"],
    Key: ["key", "password", "access", "unlock", "auth", "credential"],
    CreditCard: [
      "payment",
      "card",
      "credit",
      "debit",
      "pay",
      "visa",
      "mastercard",
    ],
    DollarSign: ["money", "dollar", "cash", "currency", "usd", "price", "cost"],
    PoundSterling: ["pound", "gbp", "sterling", "money", "currency", "uk"],
    Euro: ["euro", "eur", "money", "currency", "europe"],
    Receipt: ["receipt", "invoice", "bill", "statement", "purchase"],
    ShoppingCart: [
      "cart",
      "shop",
      "shopping",
      "basket",
      "purchase",
      "buy",
      "ecommerce",
    ],
    Package: ["package", "box", "parcel", "delivery", "product", "shipment"],
    Truck: ["delivery", "truck", "shipping", "transport", "logistics"],
    BarChart: ["chart", "graph", "analytics", "statistics", "bar", "report"],
    PieChart: ["chart", "graph", "analytics", "statistics", "pie", "portion"],
    TrendingUp: ["growth", "increase", "up", "trend", "profit", "rise"],
    TrendingDown: ["decrease", "down", "trend", "loss", "decline", "fall"],
    Check: ["done", "check", "tick", "complete", "success", "yes", "confirm"],
    X: ["close", "cancel", "delete", "remove", "no", "cross", "exit"],
    Plus: ["add", "plus", "new", "create", "more"],
    Minus: ["subtract", "minus", "remove", "delete", "less"],
    Edit: ["edit", "pencil", "modify", "change", "write", "update"],
    Trash2: ["delete", "trash", "bin", "remove", "garbage", "discard"],
    Eye: ["view", "see", "show", "visible", "eye", "watch"],
    EyeOff: ["hide", "invisible", "hidden", "private", "conceal"],
    Heart: ["love", "heart", "favorite", "like", "bookmark"],
    Star: ["star", "favorite", "bookmark", "rate", "rating", "important"],
    Bell: ["notification", "bell", "alert", "reminder", "alarm", "notify"],
    AlertCircle: [
      "warning",
      "alert",
      "attention",
      "important",
      "info",
      "notice",
    ],
    HelpCircle: ["help", "question", "support", "info", "faq", "assist"],
    Info: ["info", "information", "about", "details", "i"],
    CheckCircle: ["success", "done", "complete", "verified", "approved", "ok"],
    XCircle: ["error", "failed", "wrong", "denied", "rejected", "no"],
    ArrowRight: ["next", "forward", "right", "arrow", "continue", "proceed"],
    ArrowLeft: ["back", "previous", "left", "arrow", "return", "backward"],
    ArrowUp: ["up", "upload", "top", "arrow", "increase", "ascend"],
    ArrowDown: ["down", "download", "bottom", "arrow", "decrease", "descend"],
    ChevronRight: ["next", "expand", "right", "chevron", "more"],
    ChevronLeft: ["back", "collapse", "left", "chevron", "less"],
    ChevronUp: ["up", "expand", "top", "chevron", "open"],
    ChevronDown: ["down", "collapse", "bottom", "chevron", "close"],
    ExternalLink: ["external", "link", "open", "new", "tab", "window", "out"],
    Link: ["link", "chain", "url", "connection", "hyperlink"],
    Copy: ["copy", "duplicate", "clone", "paste", "replicate"],
    Clipboard: ["clipboard", "paste", "copy", "board"],
    Share2: ["share", "social", "send", "forward", "distribute"],
    Send: ["send", "submit", "mail", "message", "plane", "dispatch"],
    // Add more as needed...
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    // Manually map all imported icons
    const iconMap: Record<string, LucideIcon> = {
      FileText,
      File,
      Files,
      Folder,
      FolderOpen,
      Save,
      Download,
      Upload,
      Calendar,
      Clock,
      Bell,
      Mail,
      MessageSquare,
      Phone,
      Globe,
      Home,
      Settings,
      Search,
      Filter,
      Database,
      Server,
      Shield,
      Lock,
      Key,
      CreditCard,
      DollarSign,
      PoundSterling,
      Euro,
      Receipt,
      ShoppingCart,
      Package,
      Truck,
      BarChart,
      PieChart,
      TrendingUp,
      TrendingDown,
      Check,
      X,
      Plus,
      Minus,
      Edit,
      Trash2,
      Eye,
      EyeOff,
      Heart,
      Star,
      AlertCircle,
      HelpCircle,
      Info,
      CheckCircle,
      XCircle,
      ArrowRight,
      ArrowLeft,
      ArrowUp,
      ArrowDown,
      ChevronRight,
      ChevronLeft,
      ChevronUp,
      ChevronDown,
      ExternalLink,
      Link,
      Copy,
      Clipboard,
      Share2,
      Send,
      User,
      Users,
      UserCheck,
      Building,
      Building2,
      Calculator,
      Activity,
      Wifi,
      Code,
      Terminal,
      Layers,
      Map: MapIcon,
      MapPin,
      Navigation,
      Compass,
      Grid,
      List,
      Menu,
      MoreHorizontal,
      MoreVertical,
      Circle,
      Square,
      Triangle,
      Zap,
      Cloud,
      Sun,
      Moon,
      CloudRain,
      CloudSnow,
      Wind,
      BookOpen,
      Book,
      Bookmark,
      Archive,
      Inbox,
      Briefcase,
      Award,
      Gift,
      Target,
      Flag,
      Tag,
      Tags,
      Hash,
      Camera,
      Image,
      Film,
      Video,
      Music,
      Mic,
      Volume2,
      Play,
      Pause,
      SkipForward,
      SkipBack,
      RefreshCw,
      RotateCw,
      Smartphone,
      Tablet,
      Monitor,
      Laptop,
      HardDrive,
      Cpu,
      Printer,
      Paperclip,
      Scissors,
      Type,
      Bold,
      Italic,
      AlignLeft,
      AlignCenter,
      AlignRight,
      AlignJustify,
      Columns,
      Layout,
      Sidebar,
      PanelLeft,
      PanelRight,
      LogIn,
      LogOut,
      UserPlus,
      UserMinus,
      UserX,
      GitBranch,
      GitCommit,
      GitMerge,
      GitPullRequest,
      Github,
      Gitlab,
      Chrome,
      Facebook,
      Twitter,
      Linkedin,
      Instagram,
      Youtube,
      Twitch,
      Slack,
      Battery,
      BatteryCharging,
      Bluetooth,
      Airplay,
      Cast,
      Voicemail,
      PhoneCall,
      PhoneMissed,
      PhoneOff,
      MessageCircle,
      MessagesSquare,
      FileSpreadsheet,
      FileCode,
      FileJson,
      FilePlus,
      FolderPlus,
      FolderMinus,
      FolderX,
      Gauge,
      BarChart2,
      BarChart3,
      LineChart,
      Percent,
      Wallet,
      ShoppingBag,
      Rocket,
      Plane,
      Car,
      Bus,
      Train,
    };

    // Process all icons
    for (const [key, component] of Object.entries(iconMap)) {
      if (component && typeof component === "function") {
        this.iconNames.push(key);
        this.iconComponents.set(key, component);

        // Build search index
        const lowerKey = key.toLowerCase();

        // Add the icon name itself
        this.addToSearchIndex(lowerKey, key);

        // Add parts of PascalCase names
        const parts = key.split(/(?=[A-Z])/).map((p) => p.toLowerCase());
        for (const part of parts) {
          if (part.length > 2) {
            // Skip very short parts
            this.addToSearchIndex(part, key);
          }
        }

        // Add aliases
        const aliases = this.aliases[key];
        if (aliases) {
          for (const alias of aliases) {
            this.addToSearchIndex(alias.toLowerCase(), key);
            // Also map alias to icon for reverse lookup
            if (!this.aliasMap.has(alias)) {
              this.aliasMap.set(alias, new Set());
            }
            this.aliasMap.get(alias)!.add(key);
          }
        }
      }
    }

    this.iconNames.sort();
    this.initialized = true;
  }

  private addToSearchIndex(searchTerm: string, iconName: string) {
    if (!this.searchIndex.has(searchTerm)) {
      this.searchIndex.set(searchTerm, new Set());
    }
    this.searchIndex.get(searchTerm)!.add(iconName);
  }

  getAllIconNames(): string[] {
    return this.iconNames;
  }

  getIconComponent(name: string): LucideIcon | null {
    return this.iconComponents.get(name) || null;
  }

  search(query: string, limit: number = 100): string[] {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    const results = new Map<string, number>();

    // Direct name matches
    for (const iconName of this.iconNames) {
      const lowerName = iconName.toLowerCase();
      let score = 0;

      // Exact match
      if (lowerName === searchTerm) {
        score = 1000;
      }
      // Starts with
      else if (lowerName.startsWith(searchTerm)) {
        score = 900 - (lowerName.length - searchTerm.length);
      }
      // Contains
      else if (lowerName.includes(searchTerm)) {
        const index = lowerName.indexOf(searchTerm);
        score = 700 - index * 10;
      }

      if (score > 0) {
        results.set(iconName, score);
      }
    }

    // Search index matches (includes aliases and word parts)
    for (const [term, iconSet] of this.searchIndex.entries()) {
      let score = 0;

      if (term === searchTerm) {
        score = 950;
      } else if (term.startsWith(searchTerm)) {
        score = 850 - (term.length - searchTerm.length) * 5;
      } else if (searchTerm.length >= 3 && term.includes(searchTerm)) {
        score = 650 - term.indexOf(searchTerm) * 5;
      }

      if (score > 0) {
        for (const iconName of iconSet) {
          const currentScore = results.get(iconName) || 0;
          results.set(iconName, Math.max(currentScore, score));
        }
      }
    }

    // Sort by score and return top results
    return Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }

  getCommonIconNames(): string[] {
    // Return a curated list of commonly used icons
    return [
      "FileText",
      "File",
      "Folder",
      "FolderOpen",
      "Save",
      "Download",
      "Upload",
      "Share2",
      "Calendar",
      "Clock",
      "Bell",
      "Mail",
      "User",
      "Users",
      "UserCheck",
      "Building2",
      "Home",
      "Settings",
      "Search",
      "Filter",
      "Database",
      "Server",
      "Shield",
      "Lock",
      "CreditCard",
      "DollarSign",
      "Receipt",
      "ShoppingCart",
      "BarChart",
      "PieChart",
      "TrendingUp",
      "Activity",
      "Check",
      "X",
      "Plus",
      "Minus",
      "Edit",
      "Trash2",
      "Copy",
      "Clipboard",
      "Eye",
      "EyeOff",
      "Heart",
      "Star",
      "AlertCircle",
      "HelpCircle",
      "Info",
      "CheckCircle",
      "ArrowRight",
      "ArrowLeft",
      "ChevronDown",
      "ChevronRight",
      "ExternalLink",
      "Link",
      "Globe",
      "Map",
      "Phone",
      "MessageSquare",
      "Send",
      "Wifi",
      "Github",
      "Code",
      "Terminal",
      "Layers",
    ].filter((name) => this.iconComponents.has(name));
  }
}

// Create singleton instance
const iconIndex = new IconIndex();

// Export functions that use the singleton
export const getAllIconNames = () => iconIndex.getAllIconNames();
export const getIconComponent = (name: string) =>
  iconIndex.getIconComponent(name);
export const searchIcons = (query: string, limit?: number) =>
  iconIndex.search(query, limit);
export const getCommonIconNames = () => iconIndex.getCommonIconNames();
