import { forwardRef, useContext } from "react";
import {
  IconContext,
  Archive as RawArchive,
  ArrowCounterClockwise as RawArrowCounterClockwise,
  ArrowDown as RawArrowDown,
  ArrowElbowDownLeft as RawArrowElbowDownLeft,
  ArrowLeft as RawArrowLeft,
  ArrowRight as RawArrowRight,
  ArrowUp as RawArrowUp,
  ArrowUpRight as RawArrowUpRight,
  Bell as RawBell,
  BellZ as RawBellZ,
  BoundingBox as RawBoundingBox,
  CaretDown as RawCaretDown,
  CaretRight as RawCaretRight,
  ChatsCircle as RawChatsCircle,
  Check as RawCheck,
  CheckCircle as RawCheckCircle,
  Copy as RawCopy,
  CornersIn as RawCornersIn,
  CornersOut as RawCornersOut,
  CreditCard as RawCreditCard,
  Crop as RawCrop,
  Diamond as RawDiamond,
  DotsThree as RawDotsThree,
  DownloadSimple as RawDownloadSimple,
  EnvelopeSimple as RawEnvelopeSimple,
  File as RawFile,
  FolderMinus as RawFolderMinus,
  FolderPlus as RawFolderPlus,
  FolderSimple as RawFolderSimple,
  FolderSimpleMinus as RawFolderSimpleMinus,
  Folders as RawFolders,
  Gear as RawGear,
  GearSix as RawGearSix,
  Gift as RawGift,
  Globe as RawGlobe,
  Heart as RawHeart,
  Image as RawImage,
  ImageSquare as RawImageSquare,
  Images as RawImages,
  Info as RawInfo,
  LightbulbFilament as RawLightbulbFilament,
  Lightning as RawLightning,
  LinkSimple as RawLinkSimple,
  MagnifyingGlass as RawMagnifyingGlass,
  MagnifyingGlassMinus as RawMagnifyingGlassMinus,
  MagnifyingGlassPlus as RawMagnifyingGlassPlus,
  Microphone as RawMicrophone,
  MicrophoneStage as RawMicrophoneStage,
  MusicNotes as RawMusicNotes,
  PaperPlaneTilt as RawPaperPlaneTilt,
  Paperclip as RawPaperclip,
  Pause as RawPause,
  PencilSimple as RawPencilSimple,
  Play as RawPlay,
  Plus as RawPlus,
  PlusSquare as RawPlusSquare,
  PushPin as RawPushPin,
  Question as RawQuestion,
  ShareNetwork as RawShareNetwork,
  SidebarSimple as RawSidebarSimple,
  SignIn as RawSignIn,
  SignOut as RawSignOut,
  SkipBack as RawSkipBack,
  SkipForward as RawSkipForward,
  SlidersHorizontal as RawSlidersHorizontal,
  SpeakerHigh as RawSpeakerHigh,
  SpeakerSlash as RawSpeakerSlash,
  Square as RawSquare,
  SquaresFour as RawSquaresFour,
  Stack as RawStack,
  Star as RawStar,
  TextT as RawTextT,
  ThumbsDown as RawThumbsDown,
  ThumbsUp as RawThumbsUp,
  Timer as RawTimer,
  Trash as RawTrash,
  UserCircle as RawUserCircle,
  VideoCamera as RawVideoCamera,
  Wallet as RawWallet,
  WarningCircle as RawWarningCircle,
  X as RawX,
  XCircle as RawXCircle,
} from "@phosphor-icons/react";
import { getOutlineMetrics } from "./icon-stroke.js";
import "./icon-stroke.css";

// Phosphor outlines are filled polygons, so CSS stroke-width alone does not
// control their visible line. Add only the missing width around each contour.
function fixedStrokeIcon(Glyph, normalize = true) {
  const Wrapped = forwardRef(function FixedStrokeIcon({ size, width, height, weight, style, ...props }, ref) {
    const context = useContext(IconContext);
    const resolvedSize = size ?? context.size ?? 24;
    const resolvedWeight = weight ?? context.weight ?? "regular";
    const outlined = normalize && resolvedWeight !== "fill" && resolvedWeight !== "duotone";
    const metrics = getOutlineMetrics(height ?? width ?? resolvedSize);
    return <Glyph {...props} ref={ref} size={resolvedSize} {...(width === undefined ? {} : { width })} {...(height === undefined ? {} : { height })}
      weight={outlined ? metrics.weight : resolvedWeight}
      data-ui-outline={outlined ? "polygon" : undefined}
      style={outlined ? { ...context.style, "--ui-outline-offset": `${metrics.offset}px`, ...style } : style ?? context.style} />;
  });
  Wrapped.displayName = `FixedStroke(${Glyph.displayName || "Icon"})`;
  return Wrapped;
}

export const Archive = /* @__PURE__ */ fixedStrokeIcon(RawArchive);
export const ArrowCounterClockwise = /* @__PURE__ */ fixedStrokeIcon(RawArrowCounterClockwise);
export const ArrowDown = /* @__PURE__ */ fixedStrokeIcon(RawArrowDown);
export const ArrowElbowDownLeft = /* @__PURE__ */ fixedStrokeIcon(RawArrowElbowDownLeft);
export const ArrowLeft = /* @__PURE__ */ fixedStrokeIcon(RawArrowLeft);
export const ArrowRight = /* @__PURE__ */ fixedStrokeIcon(RawArrowRight);
export const ArrowUp = /* @__PURE__ */ fixedStrokeIcon(RawArrowUp);
export const ArrowUpRight = /* @__PURE__ */ fixedStrokeIcon(RawArrowUpRight);
export const Bell = /* @__PURE__ */ fixedStrokeIcon(RawBell);
export const BellZ = /* @__PURE__ */ fixedStrokeIcon(RawBellZ);
export const BoundingBox = /* @__PURE__ */ fixedStrokeIcon(RawBoundingBox);
export const CaretDown = /* @__PURE__ */ fixedStrokeIcon(RawCaretDown);
export const CaretRight = /* @__PURE__ */ fixedStrokeIcon(RawCaretRight);
export const ChatsCircle = /* @__PURE__ */ fixedStrokeIcon(RawChatsCircle);
export const Check = /* @__PURE__ */ fixedStrokeIcon(RawCheck);
export const CheckCircle = /* @__PURE__ */ fixedStrokeIcon(RawCheckCircle);
export const Copy = /* @__PURE__ */ fixedStrokeIcon(RawCopy);
export const CornersIn = /* @__PURE__ */ fixedStrokeIcon(RawCornersIn);
export const CornersOut = /* @__PURE__ */ fixedStrokeIcon(RawCornersOut);
export const CreditCard = /* @__PURE__ */ fixedStrokeIcon(RawCreditCard);
export const Crop = /* @__PURE__ */ fixedStrokeIcon(RawCrop);
export const Diamond = /* @__PURE__ */ fixedStrokeIcon(RawDiamond);
export const DotsThree = /* @__PURE__ */ fixedStrokeIcon(RawDotsThree, false);
export const DownloadSimple = /* @__PURE__ */ fixedStrokeIcon(RawDownloadSimple);
export const EnvelopeSimple = /* @__PURE__ */ fixedStrokeIcon(RawEnvelopeSimple);
export const File = /* @__PURE__ */ fixedStrokeIcon(RawFile);
export const FolderMinus = /* @__PURE__ */ fixedStrokeIcon(RawFolderMinus);
export const FolderPlus = /* @__PURE__ */ fixedStrokeIcon(RawFolderPlus);
export const FolderSimple = /* @__PURE__ */ fixedStrokeIcon(RawFolderSimple);
export const FolderSimpleMinus = /* @__PURE__ */ fixedStrokeIcon(RawFolderSimpleMinus);
export const Folders = /* @__PURE__ */ fixedStrokeIcon(RawFolders);
export const Gear = /* @__PURE__ */ fixedStrokeIcon(RawGear);
export const GearSix = /* @__PURE__ */ fixedStrokeIcon(RawGearSix);
export const Gift = /* @__PURE__ */ fixedStrokeIcon(RawGift);
export const Globe = /* @__PURE__ */ fixedStrokeIcon(RawGlobe);
export const Heart = /* @__PURE__ */ fixedStrokeIcon(RawHeart);
export const Image = /* @__PURE__ */ fixedStrokeIcon(RawImage);
export const ImageSquare = /* @__PURE__ */ fixedStrokeIcon(RawImageSquare);
export const Images = /* @__PURE__ */ fixedStrokeIcon(RawImages);
export const Info = /* @__PURE__ */ fixedStrokeIcon(RawInfo);
export const LightbulbFilament = /* @__PURE__ */ fixedStrokeIcon(RawLightbulbFilament);
export const Lightning = /* @__PURE__ */ fixedStrokeIcon(RawLightning);
export const LinkSimple = /* @__PURE__ */ fixedStrokeIcon(RawLinkSimple);
export const MagnifyingGlass = /* @__PURE__ */ fixedStrokeIcon(RawMagnifyingGlass);
export const MagnifyingGlassMinus = /* @__PURE__ */ fixedStrokeIcon(RawMagnifyingGlassMinus);
export const MagnifyingGlassPlus = /* @__PURE__ */ fixedStrokeIcon(RawMagnifyingGlassPlus);
export const Microphone = /* @__PURE__ */ fixedStrokeIcon(RawMicrophone);
export const MicrophoneStage = /* @__PURE__ */ fixedStrokeIcon(RawMicrophoneStage);
export const MusicNotes = /* @__PURE__ */ fixedStrokeIcon(RawMusicNotes);
export const PaperPlaneTilt = /* @__PURE__ */ fixedStrokeIcon(RawPaperPlaneTilt, false);
export const Paperclip = /* @__PURE__ */ fixedStrokeIcon(RawPaperclip);
export const Pause = /* @__PURE__ */ fixedStrokeIcon(RawPause);
export const PencilSimple = /* @__PURE__ */ fixedStrokeIcon(RawPencilSimple);
export const Play = /* @__PURE__ */ fixedStrokeIcon(RawPlay);
export const Plus = /* @__PURE__ */ fixedStrokeIcon(RawPlus);
export const PlusSquare = /* @__PURE__ */ fixedStrokeIcon(RawPlusSquare);
export const PushPin = /* @__PURE__ */ fixedStrokeIcon(RawPushPin);
export const Question = /* @__PURE__ */ fixedStrokeIcon(RawQuestion);
export const ShareNetwork = /* @__PURE__ */ fixedStrokeIcon(RawShareNetwork);
export const SidebarSimple = /* @__PURE__ */ fixedStrokeIcon(RawSidebarSimple);
export const SignIn = /* @__PURE__ */ fixedStrokeIcon(RawSignIn);
export const SignOut = /* @__PURE__ */ fixedStrokeIcon(RawSignOut);
export const SkipBack = /* @__PURE__ */ fixedStrokeIcon(RawSkipBack);
export const SkipForward = /* @__PURE__ */ fixedStrokeIcon(RawSkipForward);
export const SlidersHorizontal = /* @__PURE__ */ fixedStrokeIcon(RawSlidersHorizontal);
export const SpeakerHigh = /* @__PURE__ */ fixedStrokeIcon(RawSpeakerHigh);
export const SpeakerSlash = /* @__PURE__ */ fixedStrokeIcon(RawSpeakerSlash);
export const Square = /* @__PURE__ */ fixedStrokeIcon(RawSquare);
export const SquaresFour = /* @__PURE__ */ fixedStrokeIcon(RawSquaresFour);
export const Stack = /* @__PURE__ */ fixedStrokeIcon(RawStack);
export const Star = /* @__PURE__ */ fixedStrokeIcon(RawStar);
export const TextT = /* @__PURE__ */ fixedStrokeIcon(RawTextT);
export const ThumbsDown = /* @__PURE__ */ fixedStrokeIcon(RawThumbsDown);
export const ThumbsUp = /* @__PURE__ */ fixedStrokeIcon(RawThumbsUp);
export const Timer = /* @__PURE__ */ fixedStrokeIcon(RawTimer);
export const Trash = /* @__PURE__ */ fixedStrokeIcon(RawTrash);
export const UserCircle = /* @__PURE__ */ fixedStrokeIcon(RawUserCircle);
export const VideoCamera = /* @__PURE__ */ fixedStrokeIcon(RawVideoCamera);
export const Wallet = /* @__PURE__ */ fixedStrokeIcon(RawWallet);
export const WarningCircle = /* @__PURE__ */ fixedStrokeIcon(RawWarningCircle);
export const X = /* @__PURE__ */ fixedStrokeIcon(RawX);
export const XCircle = /* @__PURE__ */ fixedStrokeIcon(RawXCircle);
