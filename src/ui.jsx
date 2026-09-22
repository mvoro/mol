import { withBasePath } from './base-path.js';
import React from "react";
import {
  X, Check, ArrowUp, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown,
  ChevronsUp, Square, Paperclip, Globe, Search, Info, ArrowDown, Play, Pause,
  RotateCw, RotateCcw, Settings, File, FileText, CircleHelp, Plus, Signpost,
  Zap, Mic, PanelLeft, PanelRight, GalleryHorizontalEnd, Clapperboard, SquarePen, SquarePlus, Images,
  LayoutGrid, Folder, FolderPlus, CircleUserRound, ArrowUpRight, Crop, Gem,
  Copy, Timer, Speech, ThumbsUp, ThumbsDown, Gift, Lightbulb, Star, Heart,
  Bell, BellOff, CreditCard, CircleAlert, Wallet, Layers, Volume2, VolumeX,
  ImageUp, ImagePlus, Type, Video, Music, RectangleHorizontal,
  RectangleVertical, Ratio, Download, Mail, LogOut, LogIn, Maximize, Minimize, Sparkles, Archive,
} from "lucide-react";
import assets from "../figma-assets.json";
export const MODE_NAMES = {
  auto: "Авто",
  text: "Текст",
  image: "Картинка",
  video: "Видео",
  audio: "Аудио",
};
export const DEFAULT_MODELS = {
  auto: "Молли 1.0",
  text: "GPT-5",
  image: "Nano Banana",
  video: "Sora 2",
  audio: "Suno v5",
};
export const MODE_COLORS = {
  auto: "#7a3fff",
  text: "#ff723f",
  image: "#dc3fff",
  video: "#7a3fff",
  audio: "#3f8cff",
};
export const sourceAsset = (source, key) =>
  withBasePath("/figma/" + assets[source][key].split("/").pop());
const a = assets["figma-2335-94959"];

// Semantic names keep controls consistent across all screens. Brand marks remain assets.
export const ICON_STROKE_WIDTH = 1.75;
const icons = {
  close: X, check: Check, send: ArrowUp, arrowLeft: ArrowLeft,
  arrowRight: ChevronRight, chevronRight: ChevronRight, chevronLeft: ChevronLeft, chevron: ChevronDown,
  chevronsUp: ChevronsUp, stop: Square, attach: Paperclip, brain: Settings,
  search: Search, info: Info, down: ArrowDown, play: Play, pause: Pause,
  retry: RotateCw, undo: RotateCcw, reset: RotateCcw, file: File, document: FileText,
  help: CircleHelp, globe: Globe, add: Plus, role: Signpost, flash: Zap,
  mic: Mic, sidebar: PanelLeft, sidebarExpand: PanelRight, carousel: GalleryHorizontalEnd,
  trends: Clapperboard, newChat: SquarePlus, edit: SquarePen, files: Images, tools: LayoutGrid,
  folder: Folder, folderPlus: FolderPlus, profile: CircleUserRound,
  external: ArrowUpRight, crop: Crop, diamond: Gem, copy: Copy,
  timer: Timer, voice: Speech, like: ThumbsUp, dislike: ThumbsDown,
  gift: Gift, bulb: Lightbulb, star: Star, heart: Heart, bell: Bell,
  bellOff: BellOff, creditCard: CreditCard, circleAlert: CircleAlert,
  wallet: Wallet, layers: Layers, volume: Volume2, muted: VolumeX,
  imageImport: ImageUp, imagePlus: ImagePlus, text: Type, image: Images,
  video: Video, audio: Music, music: Music, download: Download, mail: Mail,
  settings: Settings, logout: LogOut, login: LogIn, expand: Maximize,
  collapse: Minimize, sparkles: Sparkles, archive: Archive,
};
const brandIcons = {
  telegram: withBasePath(`/figma/${a.imgSocial.split("/").pop()}`),
  molecule: withBasePath(`/figma/${a.imgFrame16.split("/").pop()}`),
};
function ratioIcon(name) {
  if (name === 'ratio-Авто') return Ratio;
  const [width, height] = name.slice(6).split(':').map(Number);
  return width === height ? Square : width > height ? RectangleHorizontal : RectangleVertical;
}
export function Icon({ name, size = 16, className = "", filled = false, ...props }) {
  if (name === 'token') return <span aria-hidden="true" className={`icon brand-token ${className}`} {...props} style={{ width: size, height: size, ...props.style }} />;
  if (name === 'balanceToken') return <span aria-hidden="true" className={`icon balance-token ${className}`} {...props} style={{ width: size, height: size, maskImage: `url(${brandIcons.molecule})`, WebkitMaskImage: `url(${brandIcons.molecule})`, ...props.style }} />;
  const src = brandIcons[name];
  if (src) return <img aria-hidden="true" alt="" className={`icon ${className}`} src={src} width={size} height={size} {...props}/>;
  const Glyph = icons[name] || (name?.startsWith('ratio-') ? ratioIcon(name) : File);
  const sidebar = name === 'sidebar' || name === 'sidebarExpand';
  return <Glyph aria-hidden="true" size={sidebar ? size * .85 : size} strokeWidth={ICON_STROKE_WIDTH}
    fill={filled ? 'currentColor' : 'none'} className={`icon ${className}`} {...props}/>;
}
const modeGlyphs = { text: Type, image: Images, video: Video, audio: Music };
export function ModeIcon({ mode = "auto", mono = false, size = 14 }) {
  if (mode === 'auto') return <img className="icon molly-mode-icon" src={sourceAsset('figma-2335-94959', 'imgMoleculs')} alt="" width={size} height={size} />;
  const Glyph = modeGlyphs[mode] || Type;
  return <span className={"mode-icon " + (mono ? "mono" : "")}
    style={{ width: size, height: size, background: mono ? "#9c9c9c" : MODE_COLORS[mode] }}>
    <Glyph aria-hidden="true" size={size * 0.64} color="#fff" strokeWidth={ICON_STROKE_WIDTH}/>
  </span>;
}
export function ModelIcon({ model = "Молли 1.0", size = 16 }) {
  const name = model.toLocaleLowerCase();
  const providerAssets = [
    ["banana", "nano-banana.svg"],
    ["sora", "sora.svg"],
    ["suno", "suno.svg"],
    ["gpt", "imgGpt5.svg"],
    ["openai", "imgGpt5.svg"],
    ["claude", "imgIcon1.svg"],
    ["deepseek", "imgIcon2.svg"],
    ["gemini", "imgIcon3.svg"],
    ["veo", "imgIcon3.svg"],
    ["grok", "imgIcon4.svg"],
    ["perplexity", "imgIcon5.svg"],
    ["kimi", "imgIcon6.svg"],
    ["qwen", "imgIcon7.svg"],
    ["glm", "imgIcon8.svg"],
  ];
  const named = providerAssets.find(([match]) => name.includes(match))?.[1];
  const src = name.includes("молли")
    ? withBasePath("/figma/" + a.imgMoleculs.split("/").pop())
    : named
      ? withBasePath("/assets/models/" + named)
      : null;
  return src ? (
    <img className="icon" src={src} alt="" width={size} height={size} />
  ) : (
    <ModeIcon
      mode={
        name.includes("kling") || name.includes("runway")
          ? "video"
          : name.includes("elevenlabs")
            ? "audio"
            : name.includes("flux") || name.includes("recraft")
              ? "image"
              : "text"
      }
      size={size}
    />
  );
}
export function IconButton({
  icon,
  label,
  onClick,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={"icon-button " + className}
      onClick={onClick}
      {...props}
    >
      {children || <Icon name={icon} />}
    </button>
  );
}
