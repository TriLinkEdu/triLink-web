/**
 * Kit `<Icon name="…"/>` — straight port of the TRILINK kit's icon
 * component, mapping the kit's icon names to Lucide React equivalents.
 *
 * The kit's JSX uses string names (`<Icon name="users" />`); this lets us
 * port that JSX verbatim into trilink-web without rewriting every callsite.
 *
 * Stroke width and viewBox match the kit (1.5 px stroke, 24 viewBox).
 */
import {
    AlertCircle,
    AlertTriangle,
    Archive,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Asterisk,
    Bell,
    BookOpen,
    Book,
    BookText,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Clock,
    Command,
    Copy,
    Cog,
    Download,
    Edit3,
    Eye,
    Filter,
    Flag,
    Flame,
    FlaskConical,
    Globe,
    GraduationCap,
    Grip,
    History,
    Home,
    Inbox,
    Keyboard,
    Laptop,
    Layers,
    Library,
    List,
    Lock,
    LogOut,
    Megaphone,
    Minus,
    Moon,
    MoreHorizontal,
    MoreVertical,
    Package,
    Pause,
    PenLine,
    Pin,
    Play,
    Plus,
    RefreshCw,
    Search,
    Send,
    Settings,
    Share2,
    Shield,
    SlidersHorizontal,
    Smartphone,
    Smile,
    Sparkles,
    Star,
    Sun,
    Target,
    Trash2,
    TrendingUp,
    Trophy,
    Upload,
    User,
    Users,
    Wifi,
    X,
    Zap,
    FileText,
    Paperclip,
    Send as PaperPlane,
    Activity,
    type LucideIcon,
} from "lucide-react";

export type KitIconName =
    | "home" | "book" | "cap" | "users" | "user" | "chart" | "bell" | "chat"
    | "cal" | "settings" | "file" | "edit" | "grid" | "check" | "plus"
    | "arrowRight" | "chev" | "chevDown" | "chevUpDown" | "chevLeft" | "chevRight"
    | "search" | "bolt" | "sparkles" | "asterisk" | "flag" | "clock" | "eye"
    | "lock" | "logout" | "inbox" | "megaphone" | "target" | "upload"
    | "download" | "play" | "pause" | "alert" | "alertTri" | "shield"
    | "library" | "list" | "layers" | "paper" | "star" | "trophy" | "heart"
    | "family" | "cog" | "flask" | "globe" | "activity" | "sliders"
    | "refresh" | "wifi" | "paperPlane" | "history" | "keyhole" | "package"
    | "moon" | "sun" | "command" | "moreH" | "moreV" | "minus" | "arrowUp"
    | "arrowDown" | "filter" | "pin" | "book2" | "archive" | "share" | "copy"
    | "trash" | "grip" | "send" | "smile" | "paperclip" | "enter" | "escape"
    | "user2" | "bookOpen" | "flame" | "pulse" | "smartphone" | "laptop";

const map: Partial<Record<KitIconName, LucideIcon>> = {
    home:       Home,
    book:       Book,
    cap:        GraduationCap,
    users:      Users,
    user:       User,
    chart:      TrendingUp,
    bell:       Bell,
    chat:       Send,
    cal:        Calendar,
    settings:   Settings,
    file:       FileText,
    edit:       Edit3,
    grid:       Layers,
    check:      Check,
    plus:       Plus,
    arrowRight: ArrowRight,
    chev:       ChevronRight,
    chevDown:   ChevronDown,
    chevUpDown: ChevronsUpDown,
    chevLeft:   ChevronLeft,
    chevRight:  ChevronRight,
    search:     Search,
    bolt:       Zap,
    sparkles:   Sparkles,
    asterisk:   Asterisk,
    flag:       Flag,
    clock:      Clock,
    eye:        Eye,
    lock:       Lock,
    logout:     LogOut,
    inbox:      Inbox,
    megaphone:  Megaphone,
    target:     Target,
    upload:     Upload,
    download:   Download,
    play:       Play,
    pause:      Pause,
    alert:      AlertCircle,
    alertTri:   AlertTriangle,
    shield:     Shield,
    library:    Library,
    list:       List,
    layers:     Layers,
    paper:      FileText,
    star:       Star,
    trophy:     Trophy,
    heart:      Star,
    family:     Users,
    cog:        Cog,
    flask:      FlaskConical,
    globe:      Globe,
    activity:   Activity,
    sliders:    SlidersHorizontal,
    refresh:    RefreshCw,
    wifi:       Wifi,
    paperPlane: PaperPlane,
    history:    History,
    keyhole:    Keyboard,
    package:    Package,
    moon:       Moon,
    sun:        Sun,
    command:    Command,
    moreH:      MoreHorizontal,
    moreV:      MoreVertical,
    minus:      Minus,
    arrowUp:    ArrowUp,
    arrowDown:  ArrowDown,
    filter:     Filter,
    pin:        Pin,
    book2:      BookText,
    archive:    Archive,
    share:      Share2,
    copy:       Copy,
    trash:      Trash2,
    grip:       Grip,
    send:       Send,
    smile:      Smile,
    paperclip:  Paperclip,
    enter:      ArrowRight,
    escape:     X,
    user2:      User,
    bookOpen:   BookOpen,
    flame:      Flame,
    pulse:      Activity,
    smartphone: Smartphone,
    laptop:     Laptop,
    keyhole_alt: PenLine,
} as Partial<Record<string, LucideIcon>>;

export interface IconProps {
    name: KitIconName;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export function Icon({ name, size = 15, className, style }: IconProps) {
    const Comp = map[name] ?? AlertCircle;
    return (
        <Comp
            width={size}
            height={size}
            strokeWidth={1.5}
            className={className}
            style={style}
            aria-hidden
        />
    );
}
