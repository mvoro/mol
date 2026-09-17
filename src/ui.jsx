import React from "react";
import {
  Xmark, Check, ArrowUp, ArrowLeft, ChevronRight, Square, Paperclip,
  Globe, Magnifier, CircleInfo, ArrowDown, Play, ArrowRotateRight,
  Gear, File, CircleQuestion,
} from "@gravity-ui/icons";
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
const a = assets["figma-2335-94959"],
  p = assets["figma-2366-90475"],
  v = assets["figma-2368-92542"],
  au = assets["figma-2368-95813"],
  h = assets["figma-history"];
const icons = {
  add: a.imgVuesaxLinearAdd,
  search: a.imgVuesaxLinearSearchNormal,
  role: a.imgVuesaxLinearSignpost,
  flash: a.imgVuesaxLinearLevel,
  mic: a.imgVuesaxLinearMicrophone2,
  info: a.imgVuesaxLinearInfoCircle,
  chevron: a.imgVuesaxLinearArrowDown,
  sidebar: a.imgVuesaxLinearSidebarLeft,
  newChat: a.imgVuesaxLinearAddSquare,
  files: a.imgVuesaxLinearGallery,
  tools: a.imgVuesaxLinearElementEqual,
  folder: a.imgVuesaxLinearFolderAdd,
  profile: a.imgVuesaxLinearProfileCircle,
  telegram: a.imgSocial,
  external: a.imgVuesaxLinearArrowUp,
  crop: p.imgVuesaxLinearCrop,
  diamond: p.imgVuesaxLinearDiamonds,
  copy: p.imgVuesaxLinearCopy,
  timer: v.imgVuesaxLinearTimer,
  globe: au.imgVuesaxLinearGlobal,
  voice: au.imgVuesaxLinearVoiceCricle,
  like: h.imgVuesaxLinearLike,
  dislike: h.imgVuesaxLinearDislike,
  gift: a.imgVector2,
  bulb: a.imgVector,
  down: a.imgVector1,
  molecule: a.imgFrame16,
};
const fallback = {
  close: Xmark, check: Check, send: ArrowUp, arrowLeft: ArrowLeft,
  arrowRight: ChevronRight, stop: Square, attach: Paperclip, brain: Gear,
  search: Magnifier, info: CircleInfo, down: ArrowDown, play: Play,
  retry: ArrowRotateRight, file: File, help: CircleQuestion, globe: Globe,
};

export function Icon({ name, size = 16, className = "", filled = false, ...props }) {
  const src = icons[name];
  const F = fallback[name] || File;
  if (name === "role" || name === "profile") return <i
    aria-hidden="true" className={`icon ${className}`} {...props}
    style={{ width: size, height: size, backgroundColor: "currentColor", mask: `url(/figma/${src.split("/").pop()}) center / contain no-repeat`, WebkitMask: `url(/figma/${src.split("/").pop()}) center / contain no-repeat`, ...props.style }}
  />;
  return src ? <img aria-hidden="true" alt="" className={`icon ${className}`} src={"/figma/" + src.split("/").pop()} width={size} height={size} {...props}/>
    : <F aria-hidden="true" width={size} height={size} className={`icon ${className}`} {...props}/>;
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
