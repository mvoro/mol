import React from "react";
import {
  Plus, MagnifyingGlass, Microphone, Info, CaretDown, SidebarSimple,
  PlusSquare, Images, SquaresFour, FolderPlus, UserCircle, ArrowUpRight,
  Crop, Diamond, Copy, Timer, Globe, MicrophoneStage, ThumbsUp, ThumbsDown,
  Gift, LightbulbFilament, ArrowDown, X, Check, ArrowUp, ArrowLeft, CaretRight,
  Square, Paperclip, Gear, Play, Pause, ArrowCounterClockwise, File, Question,
  Star, Heart, MusicNotes, SpeakerHigh, Stack, Image, BoundingBox, Lightning,
  Bell, BellZ, WarningCircle, CreditCard, Wallet, XCircle, CheckCircle, TextT, VideoCamera,
} from "./outline-icons.jsx";
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
  "/figma/" + assets[source][key].split("/").pop();
const a = assets["figma-2335-94959"], p = assets["figma-2366-90475"];

// The shared facade keeps a 1.5px contour at every interface glyph size.
// Brand marks and the bespoke role silhouette keep their original identity.
const outlineIcons = {
  add: Plus, search: MagnifyingGlass, flash: Lightning, mic: Microphone,
  info: Info, chevron: CaretDown, sidebar: SidebarSimple, newChat: PlusSquare,
  files: Images, tools: SquaresFour, folder: FolderPlus, profile: UserCircle,
  external: ArrowUpRight, crop: Crop, diamond: Diamond, copy: Copy, timer: Timer,
  globe: Globe, voice: MicrophoneStage, like: ThumbsUp, dislike: ThumbsDown,
  gift: Gift, bulb: LightbulbFilament, down: ArrowDown, close: X, check: Check,
  send: ArrowUp, arrowLeft: ArrowLeft, arrowRight: CaretRight, stop: Square,
  attach: Paperclip, brain: Gear, play: Play, pause: Pause, retry: ArrowCounterClockwise,
  file: File, help: Question, star: Star, heart: Heart, music: MusicNotes,
  volume: SpeakerHigh, layers: Stack, imageImport: Image, bell: Bell, bellZ: BellZ,
  warning: WarningCircle, creditCard: CreditCard, wallet: Wallet,
  xCircle: XCircle, checkCircle: CheckCircle, text: TextT, video: VideoCamera,
};

function RoleGlyph(props) {
  return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={0.875} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.045 1.167H5.227c-.234 0-.455.081-.636.221L3.313 2.409a1.01 1.01 0 0 0 0 1.593l1.278 1.02c.18.147.408.222.636.222h4.818c.566 0 1.021-.455 1.021-1.021V2.182c0-.56-.455-1.015-1.021-1.015Z"/>
    <path d="M3.967 7h4.818c.233 0 .455.082.636.222l1.277 1.02a1.011 1.011 0 0 1 0 1.593l-1.277 1.021a1.007 1.007 0 0 1-.636.222H3.967c-.566 0-1.021-.456-1.021-1.022v-2.04C2.946 7.455 3.401 7 3.967 7Z"/>
    <path d="M7 7V5.25m0 7.583v-1.75m-1.75 1.75h3.5"/>
  </svg>;
}

function RatioGlyph({ ratio, ...props }) {
  if (ratio === 'Авто') return <BoundingBox weight="regular" {...props}/>;
  const [w, h] = ratio.split(':').map(Number);
  const scale = 18 / Math.max(w, h);
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x={(24-w*scale)/2} y={(24-h*scale)/2} width={w*scale} height={h*scale} rx={2}/>
  </svg>;
}

export function Icon({ name = 'file', size = 16, className = "", filled = false, ...props }) {
  const common = { 'aria-hidden': true, className: `icon ${className}`, width: size, height: size, ...props };
  if (name === 'role') return <RoleGlyph {...common} data-ui-outline="stroke"/>;
  if (name.startsWith('ratio-')) return <RatioGlyph ratio={name.slice(6)} {...common} data-ui-outline="stroke"/>;
  if (name === 'token') return <span {...common} style={{display:'inline-block',width:size,height:size,backgroundColor:'currentColor',mask:'url(/figma/settings-token.svg) center / contain no-repeat',...props.style}}/>;
  if (name === 'molecule' || name === 'telegram') return <img {...common} alt="" src={sourceAsset('figma-2335-94959', name === 'molecule' ? 'imgFrame16' : 'imgSocial')}/>;
  const Glyph = outlineIcons[name] || File;
  return <Glyph {...common} weight={filled ? 'fill' : 'regular'}/>;
}
const modeGlyphs = {
  auto: p.imgFrame15,
  text: a.imgVuesaxLinearText,
  image: a.imgVuesaxLinearGallery1,
  video: a.imgVuesaxLinearVideo,
  audio: a.imgVuesaxLinearAudioSquare,
};
export function ModeIcon({ mode = "auto", mono = false, size = 14 }) {
  if (mode === 'auto') return <img className="icon molly-mode-icon" src={sourceAsset('figma-2335-94959', 'imgMoleculs')} alt="" width={size} height={size} />;
  return (
    <span
      className={"mode-icon " + (mono ? "mono" : "")}
      style={{
        width: size,
        height: size,
        background: mono ? "#9c9c9c" : MODE_COLORS[mode],
      }}
    >
      <img
        alt=""
        src={"/figma/" + modeGlyphs[mode].split("/").pop()}
        width={size * 0.64}
        height={size * 0.64}
      />
    </span>
  );
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
    ? "/figma/" + a.imgMoleculs.split("/").pop()
    : named
      ? "/assets/models/" + named
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
