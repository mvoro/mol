import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import {
  Icon,
  IconButton,
  ModelIcon,
  ModeIcon,
  MODE_NAMES,
  DEFAULT_MODELS,
  sourceAsset,
} from "./ui.jsx";
import {
  ChatComposer,
  defaultValues,
  FileChip,
} from "./components/ChatComposer.jsx";
import { ModelPicker } from "./components/ModelPicker.jsx";
import { TextInput } from "./components/TextInput.jsx";
import { AudioResult } from "./components/AudioResult.jsx";
import { PromptText } from "./components/PromptInput.jsx";
import { MediaResult } from "./components/MediaResult.jsx";
import { collectReadyMedia } from "./media-history.js";
import { useChatAutoScroll } from "./components/useChatAutoScroll.js";
import { HomeExperience } from "./components/HomeExperience.jsx";
import { ProfileMenu } from "./components/ProfileMenu.jsx";
import { HistoryRow } from "./components/HistoryRow.jsx";
import { HistoryDialog } from "./components/HistoryDialog.jsx";
import { AccountPanel } from "./components/AccountPanel.jsx";
import { PromptSuggestions } from "./components/PromptSuggestions.jsx";
import { ComponentGallery } from "./components/ComponentGallery.jsx";
import { ProjectSelect, ProjectDialog, ProjectIcon } from "./components/Projects.jsx";
import { ProjectRow, ProjectWorkspace, ProjectActionDialog } from "./components/ProjectWorkspace.jsx";
import { RolesShowcase } from "./components/RolesShowcase.jsx";
import { NotificationCenter } from "./components/NotificationCenter.jsx";
import { BillingModal } from "./components/BillingModal.jsx";
import { CarouselStudio } from "./components/CarouselStudio.jsx";
import { TrendsStudio } from "./components/TrendsStudio.jsx";
import { PROJECTS_KEY, HISTORY_KEY, PROJECT_COLORS, readProjects, readHistory, persist, conversationSnapshot, upsertConversation, selectHistory } from "./project-history.js";
import { useMobileDrawer } from './hooks/useMobileDrawer.js';
import { useMobileViewport } from './components/useMobileViewport.js';
import { createGenerationNotification } from './notifications.js';
import { createGenerationRequest, createDemoMedia, describeRequestOptions, chatImageReferences } from './generation-request.js';
import { resolveAppNavigation } from './app-navigation.js';
import { withBasePath } from './base-path.js';
import { documentFormat, ensureDocumentDemo } from './artifact-model.js';
import { storeDocument } from './document-storage.js';
import { ArtifactPanel } from './components/ArtifactPanel.jsx';
const MediaViewer = lazy(() => import("./components/MediaViewer.jsx").then(module => ({ default: module.MediaViewer })));
const AudioPlayer = lazy(() => import("./components/AudioPlayer.jsx").then(module => ({ default: module.AudioPlayer })));
const AuthModal = lazy(() => import("./components/AuthModal.jsx").then(module => ({ default: module.AuthModal })));
const HISTORY = [
  "5 вирусных фактов о верблюдах",
  "Посчитай экономический эффект",
  "Составь список гостей на мероприятие",
  "Подготовь отчет для нотариуса",
  "Сделай анализ резюме по шаблону",
  "Напиши краткое эссе на тему",
  "Сделай сравнение двух устройств",
  "Оцени качество полученного материала",
  "Выбери арбуз и скажи какой лучше",
  "Сочини песню для новогоднего спектакля",
  "Сделай сочинение на тему как я провел лето",
  "Создай изображение в стиле art",
];
const CAMEL =
  "Вот 5 фактов о верблюдах, которые звучат как «вирусные» и легко могут зацепить внимание:\n\n1. 🐪 Верблюд может выпить до 200 литров воды за один раз — это как если бы человек залил в себя всю ванну.\n\n2. ❄️ Несмотря на жизнь в пустыне, верблюды выдерживают мороз до −40°C (в Монголии они реально живут в таких условиях).\n\n3. 👀 Их длинные ресницы — это не «гламур», а броня: они защищают глаза от песчаных бурь лучше любых очков.\n\n4. 💨 Верблюды не потеют до тех пор, пока температура тела не превысит +41°C — так они экономят воду.\n\n5. 🏔️ Миф: «горбы заполнены водой». На самом деле там жир, а воду верблюды хранят в клетках крови — их эритроциты могут растягиваться в 2–3 раза больше, чем у человека.\n\nХочешь, я сделаю из этих фактов короткий формат для соцсетей (например, как карусель или «hook + факт»)?";
const imageKeys = [
  "imgRectangle36",
  "imgRectangle34",
  "imgRectangle33",
  "imgRectangle35",
  "imgRectangle37",
];
const examplePrompts = [
  "Минималистичный рекламный постер со стеклянными кубиками льда",
  "Яркая сюрреалистичная комната в розовых и сиреневых тонах",
  "Девушка на облаках под ярким голубым небом",
  "Маленький дом на зелёном острове в небе",
  "Разноцветные стеклянные карточки на светлом фоне",
];
const readLocal = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const sampleConversation = entry => ({ ...entry, projectId: null, mode: 'auto', model: 'Молли 1.0', values: defaultValues('auto'), messages: [
  { id: `${entry.id}-u`, role: 'user', text: entry.title === HISTORY[0] ? 'Придумай 5 вирусных фактов о верблюдах' : entry.title },
  { id: `${entry.id}-a`, role: 'assistant', mode: 'auto', model: 'Молли 1.0', text: entry.title === HISTORY[0] ? CAMEL : `Давайте разберём задачу «${entry.title}».\n\nСначала определим цель и исходные данные. Затем составим структуру и подготовим результат. Пришлите подробности — и продолжим.` },
] });
export function App() {
  const [projectAction, setProjectAction] = useState(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => { const saved = readLocal('molecula-notifications', []); return Array.isArray(saved) ? saved : []; });
  useEffect(() => persist(localStorage, 'molecula-notifications', notifications), [notifications]);
  const [historyAction, setHistoryAction] = useState(null);
  const [historyArchived, setHistoryArchived] = useState(false);
  const [rolesReturnRoute, setRolesReturnRoute] = useState('chat');
  const [deletedChat, setDeletedChat] = useState(null);
  const [hiddenSamples, setHiddenSamples] = useState(() => { const value = readLocal('molecula-hidden-samples', []); return Array.isArray(value) ? value : []; });
  useEffect(() => persist(localStorage, 'molecula-hidden-samples', hiddenSamples), [hiddenSamples]);
  useEffect(() => { if (!deletedChat) return; const timeout = setTimeout(() => setDeletedChat(null), 8000); return () => clearTimeout(timeout); }, [deletedChat]);
  const [account, setAccount] = useState(() => readLocal("molecula-account", { name: "mock-mail@gmail.com", email: "mock-mail@gmail.com" }));
  const [preferences, setPreferences] = useState(() => readLocal("molecula-preferences", { sendOnEnter: true }));
  const [accountSection, setAccountSection] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [viewerId, setViewerId] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactFull, setArtifactFull] = useState(false);
  const openArtifact = file => { setArtifact(file); setArtifactOpen(true); setSidebarOpen(false); };
  const [audioQueue, setAudioQueue] = useState([]);
  const [audioId, setAudioId] = useState(null);
  useEffect(() => persist(localStorage, "molecula-account", account), [account]);
  useEffect(() => persist(localStorage, "molecula-preferences", preferences), [preferences]);
  const [mode, setMode] = useState("auto"),
    [models, setModels] = useState(DEFAULT_MODELS),
    [allValues, setAllValues] = useState(() =>
      Object.fromEntries(
        Object.keys(MODE_NAMES).map((m) => [m, defaultValues(m)]),
      ),
    ),
    [messages, setMessages] = useState([]),
    [history, setHistory] = useState(() => ensureDocumentDemo(readHistory(localStorage))),
    [projectState, setProjectState] = useState(() => {
      const saved = readProjects(localStorage);
      const linkedId = new URLSearchParams(window.location.search).get('project');
      return { ...saved, activeId: saved.projects.some(project => project.id === linkedId) ? linkedId : null };
    }),
    [newProjectOpen, setNewProjectOpen] = useState(false),
    [expandedProjects, setExpandedProjects] = useState([]),
    [files, setFiles] = useState([]),
    [modelOpen, setModelOpen] = useState(false),
    [roleOpen, setRoleOpen] = useState(false),
    [inspectedRole, setInspectedRole] = useState(""),
    [sidebarOpen, setSidebarOpen] = useState(false),
    [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches),
    [collapsed, setCollapsed] = useState(() => readLocal('molecula-sidebar-collapsed', true) === true),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [route, setRoute] = useState(() => resolveAppNavigation(window.location, { projects: projectState.projects, history }).route),
    [conversationRoute, setConversationRoute] = useState(projectState.activeId ? 'project' : 'chat'),
    [visitedStudios, setVisitedStudios] = useState(() => ['carousel', 'trends'].includes(route) ? [route] : []),
    [studioResultIds, setStudioResultIds] = useState({}),
    [draft, setDraft] = useState(""),
    [composerKey, setComposerKey] = useState(0),
    [generating, setGenerating] = useState(false),
    [toast, setToast] = useState(""),
    [examplesOpen, setExamplesOpen] = useState(false),
    [offer, setOffer] = useState(false);
  const contentRoute = route === 'roles' ? rolesReturnRoute : route;
  const studioActive = contentRoute === 'carousel' || contentRoute === 'trends';
  useEffect(() => persist(localStorage, 'molecula-sidebar-collapsed', collapsed), [collapsed]);
  useEffect(() => {
    if (studioActive) setVisitedStudios(previous => previous.includes(contentRoute) ? previous : [...previous, contentRoute]);
  }, [contentRoute, studioActive]);
  const { shellRef, mainRef } = useMobileDrawer({enabled:isMobile && route !== 'components',open:sidebarOpen,onOpenChange:setSidebarOpen});
  useMobileViewport();
  const timer = useRef(null),
    end = useRef(null),
    urls = useRef([]),
    latestMessages = useRef(messages),
    historyRef = useRef(history),
    currentChat = useRef(null),
    projectDestination = useRef(projectState.activeId);
  const { scrollRef: scroll, resetFollowing, handlers: chatScrollHandlers } = useChatAutoScroll(messages, audioId);
  const readyMedia = useMemo(() => collectReadyMedia(history, messages), [history, messages]);
  const openMedia = id => {
    const item = readyMedia.find(media => media.id === id);
    if (!item) return;
    setSidebarOpen(false);
    if (item.type === "audio") { setAudioQueue(readyMedia.filter(media => media.type === "audio")); setAudioId(id); }
    else setViewerId(id);
  };
  latestMessages.current = messages;
  historyRef.current = history;
  projectDestination.current = projectState.activeId;
  const projects = projectState.projects;
  const activeProject = projects.find(project => project.id === projectState.activeId);
  useEffect(() => persist(localStorage, PROJECTS_KEY, projectState), [projectState]);
  useEffect(() => persist(localStorage, HISTORY_KEY, history), [history]);
  const settings = allValues[mode],
    model = models[mode];
  const openRoleInfo = role => {
    setInspectedRole(role || settings.role);
    setRoleOpen(true);
  };
  useEffect(() => {
    const saveBeforeLeaving = () => {
      if (!generating || !currentChat.current) return;
      const snapshot = conversationSnapshot({ id: currentChat.current, title: historyRef.current.find(chat => chat.id === currentChat.current)?.title, projectId: projectDestination.current, mode, model, values: settings, messages: latestMessages.current });
      persist(localStorage, HISTORY_KEY, upsertConversation(history, snapshot));
    };
    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => window.removeEventListener("pagehide", saveBeforeLeaving);
  }, [generating, history, mode, model, settings]);
  useEffect(() => {
    const pointer = () => (document.body.dataset.input = "pointer");
    const key = (e) => {
      document.body.dataset.input = "keyboard";
      if (document.querySelector('[aria-modal="true"]')) return;
      if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        if (!generating && !studioActive) changeMode(Object.keys(MODE_NAMES)[Number(e.key) - 1]);
      }
      if (e.key === "Escape") {
        setModelOpen(false);
        setRoleOpen(false);
        setSidebarOpen(false);
        setExamplesOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.matchMedia('(max-width: 700px)').matches) setSidebarOpen(true);
        else setCollapsed(false);
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [generating, studioActive]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => { setIsMobile(media.matches); setSidebarOpen(false); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!sidebarOpen || !isMobile) return;
    const panel = shellRef.current?.querySelector('.sidebar');
    const trigger = mainRef.current?.querySelector('[aria-controls="mobile-navigation"]');
    const hasTopLayer = () => [...document.querySelectorAll('[aria-modal="true"], [role="menu"]')].some(dialog => dialog !== panel && !panel?.contains(dialog));
    const visibleItems = () => [...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')].filter(item => !item.closest('[inert]') && item.getClientRects().length && getComputedStyle(item).visibility !== 'hidden');
    const focusPanel = () => {
      if (!panel?.isConnected || hasTopLayer()) return;
      (document.body.dataset.input === 'keyboard' ? visibleItems()[0] || panel : panel).focus({preventScroll:true});
    };
    const frame = requestAnimationFrame(focusPanel);
    const onKey = event => {
      if (hasTopLayer()) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setSidebarOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = visibleItems();
      if (!items.length) {event.preventDefault();panel.focus();return;}
      if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === panel)) {event.preventDefault();items.at(-1).focus();}
      else if (!event.shiftKey && document.activeElement === items.at(-1)) {event.preventDefault();items[0].focus();}
    };
    const containFocus = event => {if (!panel.contains(event.target) && !hasTopLayer()) focusPanel();};
    document.addEventListener('keydown',onKey);
    document.addEventListener('focusin',containFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('focusin',containFocus);
      if (document.body.dataset.input === 'keyboard' && trigger?.isConnected) trigger.focus({preventScroll:true});
    };
  }, [sidebarOpen,isMobile,shellRef,mainRef]);
  useEffect(
    () => () => {
      clearInterval(timer.current);
      urls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );
  const navigate = (next) => {
    setArtifactOpen(false);
    setRoute(next);
    if (next === 'chat' || next === 'project') setConversationRoute(next);
    window.history.pushState(
      {},
      "",
      withBasePath(['components', 'roles', 'carousel', 'trends'].includes(next) ? `/${next}` : next === "project" && projectDestination.current ? `/?project=${encodeURIComponent(projectDestination.current)}` : "/"),
    );
    setSidebarOpen(false);
  };
  useEffect(() => {
    const handler = () => {
      const target = resolveAppNavigation(window.location, {
        projects, history: historyRef.current, conversationRoute,
        currentChatId: currentChat.current, activeProjectId: projectDestination.current,
      });
      if (!target.preserveConversation) {
        if (target.chatId) openHistory(historyRef.current.find(chat => chat.id === target.chatId), false);
        else newChat(target.projectId, false);
      }
      setRoute(target.route);
      if (target.route === 'chat' || target.route === 'project') setConversationRoute(target.route);
      setSidebarOpen(false);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [projects, generating, mode, model, settings, conversationRoute]);
  const changeMode = (next) => {
    if (generating) return;
    setMode(next);
    setDraft("");
  };
  const changeValue = (key, value) =>
    setAllValues((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [key]: value },
    }));
  const saveConversation = (items, id = currentChat.current) => {
    if (!id || !items.some(item => item.role === 'user')) return;
    const snapshot = conversationSnapshot({ id, title: historyRef.current.find(chat => chat.id === id)?.title, projectId: projectDestination.current, mode, model, values: settings, messages: items });
    setHistory(previous => upsertConversation(previous, snapshot));
    return snapshot;
  };
  const stop = () => {
    clearInterval(timer.current);
    timer.current = null;
    const snapshot = generating ? saveConversation(latestMessages.current) : null;
    setGenerating(false);
    return snapshot;
  };
  const newChat = (destination = null, updateLocation = true) => {
    setArtifactOpen(false);
    resetFollowing();
    stop();
    setMessages([]);
    latestMessages.current = [];
    currentChat.current = null;
    const projectId = typeof destination === 'string' ? destination : null;
    projectDestination.current = projectId;
    setProjectState(previous => ({ ...previous, activeId: projectId }));
    setFiles([]);
    setDraft("");
    setMode("auto");
    setComposerKey((k) => k + 1);
    setSidebarOpen(false);
    if (updateLocation) navigate("chat");
  };
  const openAuth = () => { setSidebarOpen(false); setAccountSection(null); setAuthOpen(true); };
  const chooseHomeExample = ({ mode: nextMode, model: nextModel, prompt = "", settings: reusedSettings }) => {
    newChat();
    setMode(nextMode);
    if (reusedSettings) setAllValues(previous => ({...previous,[nextMode]:{...defaultValues(nextMode),...reusedSettings}}));
    if (nextModel) setModels(previous => ({ ...previous, [nextMode]: nextModel }));
    setDraft(prompt);
    setTimeout(() => document.querySelector(".empty-chat [data-composer-input]")?.focus({ preventScroll: true }), 0);
  };
  const openProject = (id, toggle = false) => {
    if (conversationRoute !== 'project' || projectDestination.current !== id) newChat(id, false);
    setExpandedProjects(previous => toggle && route === 'project' && projectState.activeId === id && previous.includes(id) ? previous.filter(value => value !== id) : [...new Set([...previous, id])]);
    navigate('project');
  };
  const actOnProject = (action, project) => { setSidebarOpen(false); setProjectAction({action, project}); };
  const updateProject = (id, changes) => setProjectState(previous => ({ ...previous, projects: previous.projects.map(project => project.id === id ? {...project, ...changes} : project) }));
  const deleteProject = id => {
    if (projectState.activeId === id) newChat();
    setProjectState(previous => ({ projects: previous.projects.filter(project => project.id !== id), activeId: previous.activeId === id ? null : previous.activeId }));
    setHistory(previous => previous.map(chat => chat.projectId === id ? {...chat, projectId:null} : chat));
    setExpandedProjects(previous => previous.filter(value => value !== id));
    setToast('Проект удалён. Чаты сохранены в истории.');
  };
  const createProject = (name) => {
    const id = crypto.randomUUID();
    newChat(null, false);
    setProjectState(previous => ({ projects: [...previous.projects, { id, name, color: PROJECT_COLORS[previous.projects.length % PROJECT_COLORS.length] }], activeId: id }));
    projectDestination.current = id;
    setExpandedProjects(previous => [...previous, id]);
    setToast(`Проект «${name}» создан`);
    navigate('project');
  };
  const openHistory = (entry, updateLocation = true) => {
    setArtifactOpen(false);
    resetFollowing();
    const stoppedSnapshot = stop();
    const stored = (stoppedSnapshot?.id === entry.id ? stoppedSnapshot : historyRef.current.find(chat => chat.id === entry.id)) || sampleConversation(entry);
    currentChat.current = entry.id;
    setMode(stored.mode);
    setMessages(stored.messages);
    latestMessages.current = stored.messages;
    const owner = projects.some(project => project.id === stored.projectId) ? stored.projectId : null;
    projectDestination.current = owner;
    setProjectState(previous => ({ ...previous, activeId: owner }));
    if (stored.model) setModels(previous => ({ ...previous, [stored.mode]: stored.model }));
    if (stored.values) setAllValues(previous => ({ ...previous, [stored.mode]: stored.values }));
    setFiles([]);
    setDraft("");
    setComposerKey((k) => k + 1);
    setSidebarOpen(false);
    if (updateLocation) navigate("chat"); else { setRoute("chat"); setConversationRoute('chat'); }
  };
  const send = (text, attachments, refs, prompt) => {
    if (generating) return;
    resetFollowing();
    if (route !== 'chat') navigate('chat');
    const request = text || "Посмотри на прикреплённые файлы";
    const user = {
      id: crypto.randomUUID(),
      role: "user",
      text: request,
      files: [...attachments, ...(refs || []).filter(Boolean)],
      ...(prompt ? { prompt } : {}),
    };
    const generation = createGenerationRequest({mode,model,settings,text:request,attachments,refs,messages});
    const answerId = crypto.randomUUID();
    const answer = {
      id: answerId,
      role: "assistant",
      text: "",
      mode,
      model,
      generation,
      media: createDemoMedia(generation, imageKeys.map(key => sourceAsset('figma-2366-90475', key))),
    };
    const initial = [...messages, user, answer];
    const conversationId = currentChat.current || crypto.randomUUID();
    currentChat.current = conversationId;
    latestMessages.current = initial;
    setMessages(initial);
    saveConversation(initial, conversationId);
    user.files.forEach((f) => {
      if (f.url) urls.current.push(f.url);
      if (documentFormat(f)) storeDocument(f).catch(() => setToast('Документ доступен сейчас, но браузер не смог сохранить его для следующего посещения.'));
    });
    setFiles([]);
    setDraft("");
    setGenerating(true);
    setExamplesOpen(false);
    setTimeout(
      () => {
        if (currentChat.current !== conversationId) return;
        document
          .querySelector(".chat-composer-dock [data-composer-input]")
          ?.focus({ preventScroll: true });
      },
      0,
    );
    const response = /верблюд/i.test(request)
      ? CAMEL
      : mode === "image"
        ? "Пример изображения из макета.\n\nВаш запрос: «" +
          request +
          "»\nНастройки: " +
          settings.ratio +
          " · " +
          settings.quality +
          " · " +
          settings.count +
          ".\n\nВ прототипе показан готовый пример. Для создания нового изображения нужно подключить API модели."
        : mode === "video"
          ? "Запрос на видео подготовлен.\n\n«" +
            request +
            "»\n\n" +
            model +
            " · " +
            settings.ratio +
            " · " +
            settings.duration +
            " · " +
            settings.quality +
            (refs?.[0] ? "\nНачальный кадр прикреплён." : "") +
            "\n\nЭто демонстрация флоу. Генерация видео станет доступна после подключения API."
          : mode === "audio"
            ? "Аудиозапрос подготовлен.\n\n«" +
              request +
              "»\n\nГолос: " +
              settings.voice +
              " · " +
              settings.language +
              " · " +
              settings.duration +
              ".\n\nЭто демонстрация флоу. Для синтеза аудио требуется подключение API."
            : "Давайте начнём.\n\nВы написали: «" +
              request +
              "»" +
              (settings.role
                ? "\n\nАктивная роль — " + settings.role + "."
                : "") +
              (describeRequestOptions(generation) ? "\n\n" + describeRequestOptions(generation) + "." : "") +
              "\n\nЯ могу помочь уточнить идею, составить план, написать текст или сравнить варианты. Добавьте контекст и желаемый формат результата.\n\nЭто демонстрационный ответ для проверки интерфейса; AI API пока не подключён.";
    let pos = 0;
    const mediaGeneration = ["image", "video", "audio"].includes(mode);
    const generationDelay = mode === "audio" ? 4000 : 6500;
    const startedAt = performance.now();
    timer.current = setInterval(() => {
      if (mediaGeneration && performance.now() - startedAt < generationDelay) return;
      pos = mediaGeneration ? (performance.now() - startedAt >= generationDelay ? response.length : 0) : Math.min(pos + 12, response.length);
      const streamed = initial.map((m) =>
          m.id === answerId ? { ...m, text: response.slice(0, pos), ...(m.media ? { media: { ...m.media, ready: pos === response.length } } : {}) } : m,
      );
      latestMessages.current = streamed;
      setMessages(streamed);
      if (pos === response.length) {
        clearInterval(timer.current);
        setGenerating(false);
        const done = initial.map((m) =>
          m.id === answerId ? { ...m, text: response, ...(m.media ? { media: { ...m.media, ready: true } } : {}) } : m,
        );
        saveConversation(done, conversationId);
        setNotifications(previous => [createGenerationNotification({ chatId:conversationId, messageId:answerId, mode, title:request, thumbnail:answer.media?.poster || (mode === 'image' ? answer.media?.src : undefined) }), ...previous].slice(0, 100));
      }
    }, mediaGeneration ? 100 : 34);
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Ответ скопирован");
    } catch {
      setToast("Не удалось скопировать. Выделите текст ответа.");
    }
  };
  const selectExample = (i) => {
    setDraft(examplePrompts[i]);
    setExamplesOpen(false);
    setComposerKey((k) => k + 1);
  };
  const historyEntries = [...selectHistory(history, null, historyArchived), ...HISTORY.map((title, index) => ({ id: `sample-${index}`, title })).filter(entry => !historyArchived && !hiddenSamples.includes(entry.id) && !history.some(chat => chat.id === entry.id || chat.title === entry.title))];
  const actOnHistory = (action, entry) => {
    const stored = historyRef.current.find(chat => chat.id === entry.id);
    const chat = currentChat.current === entry.id
      ? { ...stored, ...conversationSnapshot({ id: entry.id, title: entry.title, projectId: projectDestination.current, mode, model, values: settings, messages: latestMessages.current }) }
      : stored || sampleConversation(entry);
    if (['pin','archive','unassign'].includes(action)) {
      const changes = action === 'pin' ? {pinned:!chat.pinned} : action === 'archive' ? {archived:!chat.archived} : {projectId:null};
      setHistory(previous => upsertConversation(previous, {...chat, ...changes}));
      if (action === 'unassign' && currentChat.current === chat.id) {
        projectDestination.current = null;
        setProjectState(previous => ({...previous,activeId:null}));
      }
      setToast(action === 'pin' ? (changes.pinned ? 'Чат закреплён' : 'Чат откреплён') : action === 'archive' ? (changes.archived ? 'Чат в архиве' : 'Чат возвращён из архива') : 'Чат перенесён в общую историю');
      return;
    }
    if (action === 'share' && !stored) setHistory(previous => upsertConversation(previous, chat));
    if (action !== 'delete') { setSidebarOpen(false); setHistoryAction({ action, chat }); return; }
    setSidebarOpen(false);
    const sampleIds = HISTORY.map((title, index) => ({ title, id: `sample-${index}` })).filter(sample => sample.id === entry.id || sample.title === entry.title).map(sample => sample.id);
    const hiddenAdded = sampleIds.filter(id => !hiddenSamples.includes(id));
    const index = history.findIndex(item => item.id === entry.id);
    if (currentChat.current === entry.id) newChat();
    setHistory(previous => previous.filter(item => item.id !== entry.id));
    setHiddenSamples(previous => [...new Set([...previous, ...sampleIds])]);
    setDeletedChat({ chat, index, hiddenAdded });
    setToast('');
    setTimeout(() => document.querySelector('.toast-undo')?.focus({ preventScroll: true }), 0);
  };
  const saveHistoryAction = value => {
    const { action, chat } = historyAction;
    setHistory(previous => {
      const latest = previous.find(item => item.id === chat.id) || chat;
      const updated = { ...latest, ...(action === 'rename' ? { title: value } : { projectId: value }) };
      return previous.some(item => item.id === chat.id) ? previous.map(item => item.id === chat.id ? updated : item) : [updated, ...previous];
    });
    if (action === 'move') {
      if (currentChat.current === chat.id) {
        projectDestination.current = value;
        setProjectState(previous => ({ ...previous, activeId: value }));
      }
      if (value) setExpandedProjects(previous => [...new Set([...previous, value])]);
    }
  };
  const undoDelete = () => {
    if (!deletedChat) return;
    setHistory(previous => {
      if (previous.some(chat => chat.id === deletedChat.chat.id)) return previous;
      const next = [...previous];
      next.splice(Math.max(0, deletedChat.index), 0, deletedChat.chat);
      return next;
    });
    setHiddenSamples(previous => previous.filter(id => !deletedChat.hiddenAdded.includes(id)));
    setDeletedChat(null);
  };
  const chooseRole = (role, prompt = '') => {
    newChat();
    setMode('text');
    setAllValues(previous => ({ ...previous, text: { ...previous.text, role } }));
    setDraft(prompt);
  };
  const openNotification = notification => {
    if (notification.kind === 'studio') {
      setStudioResultIds(previous => ({...previous, [notification.route]: notification.resultId}));
      navigate(notification.route);
      return;
    }
    const entry = historyRef.current.find(chat => chat.id === notification.chatId);
    if (!entry) { setToast('Этот чат уже удалён'); return; }
    openHistory(entry);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`message-${notification.messageId}`)?.scrollIntoView({ block:'center', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })));
  };
  const completeStudio = (studio, result) => {
    setNotifications(previous => [{
      id: `studio-${studio}-${result.id}`, kind: 'studio', type: 'generation', route: studio,
      resultId: result.id, title: studio === 'carousel' ? 'Карусель готова' : 'Видео готово',
      description: result.title || (studio === 'carousel' ? 'Откройте готовые слайды' : 'Откройте видео с вашим персонажем'),
      mode: studio === 'carousel' ? 'image' : 'video', createdAt: result.createdAt || Date.now(),
      read: false, actionLabel: 'Открыть результат',
    }, ...previous].slice(0, 100));
  };
  useEffect(() => {
    const sharedId = new URLSearchParams(window.location.search).get('chat');
    const shared = historyRef.current.find(chat => chat.id === sharedId);
    if (shared) openHistory(shared, false);
  }, []);
  if (route === "components")
    return (
      <ComponentGallery
        onBack={() => navigate("chat")}
        imageUrl={withBasePath('/assets/composer/file-sample.png')}
      />
    );
  return (
    <div ref={shellRef} data-mobile-menu={isMobile && sidebarOpen ? "open" : "closed"} className={"app-shell " + (collapsed ? "sidebar-collapsed " : "") + (audioId ? "has-audio" : "")}>
        <button
          className="mobile-drawer-dismiss"
          type="button"
          aria-label="Закрыть меню"
          aria-hidden={!sidebarOpen}
          tabIndex={-1}
          onClick={() => setSidebarOpen(false)}
        />
      <div id="mobile-navigation" data-mobile-drawer-panel className={'sidebar-shell'+(sidebarOpen?' mobile-open':'')} aria-hidden={isMobile ? !sidebarOpen : undefined} inert={isMobile && !sidebarOpen}>
      <aside className="sidebar" tabIndex={-1} role={sidebarOpen?'dialog':undefined} aria-modal={sidebarOpen||undefined} aria-label={sidebarOpen?'Главное меню':undefined}>
        <div className="sidebar-top">
          <header className="sidebar-header">
            <button
              className="brand sidebar-brand"
              onClick={newChat}
              aria-label="Молекула — новый чат"
              tabIndex={collapsed && !isMobile ? -1 : undefined}
              aria-hidden={collapsed && !isMobile ? true : undefined}
            >
              <img
                src={sourceAsset("figma-2335-94959", "imgFrame15")}
                alt=""
                width="20"
                height="20"
              />
              <img
                src={sourceAsset("figma-2335-94959", "imgGroup7")}
                alt="Молекула"
                width="85"
                height="20"
              />
            </button>
            <IconButton
              className="sidebar-collapse-control"
              icon={collapsed && !isMobile ? 'sidebarExpand' : 'sidebar'}
              label={collapsed && !isMobile ? 'Развернуть меню' : 'Свернуть меню'}
              aria-controls="mobile-navigation"
              aria-expanded={isMobile ? sidebarOpen : !collapsed}
              onClick={() => {
                if (!window.matchMedia("(max-width: 700px)").matches) setCollapsed(!collapsed);
                setSidebarOpen(false);
              }}
            ><Icon name={collapsed && !isMobile ? 'sidebarExpand' : 'sidebar'} size={20}/></IconButton>
          </header>
          <nav className="main-navigation" aria-label="Создать">
            <button onClick={newChat} aria-label="Новый чат" title="Новый чат">
              <Icon name="newChat" size={18} />
              <span>Новый чат</span>
            </button>
            <button className={contentRoute === 'carousel' ? 'is-active' : ''} aria-current={contentRoute === 'carousel' ? 'page' : undefined} aria-label="Карусель" title="Карусель" onClick={() => navigate('carousel')}>
              <Icon name="carousel" size={18} />
              <span>Карусель</span>
            </button>
            <button className={contentRoute === 'trends' ? 'is-active' : ''} aria-current={contentRoute === 'trends' ? 'page' : undefined} aria-label="Тренды" title="Тренды" onClick={() => navigate('trends')}>
              <Icon name="trends" size={18} />
              <span>Тренды</span>
            </button>
          </nav>
        </div>
        <div className="sidebar-scroll">
          <nav className="main-navigation sidebar-secondary-navigation" aria-label="Библиотека">
            <button className="rail-search" aria-label="Поиск по чатам" title="Поиск по чатам" onClick={() => {setCollapsed(false);setSearchOpen(true);}}>
              <Icon name="search" size={18}/><span>Поиск по чатам</span>
            </button>
            <button className={route === 'roles' ? 'is-active' : ''} aria-label="Витрина ролей" title="Витрина ролей" onClick={() => {setRolesReturnRoute(route);navigate('roles');}}>
              <Icon name="role" size={18}/><span>Витрина ролей</span>
            </button>
          </nav>
          <section className="sidebar-projects" aria-label="Проекты">
            <div className="history-label">
              <span>Проекты</span>
              <IconButton icon="add" label="Новый проект" onClick={() => { setNewProjectOpen(true); setSidebarOpen(false); }} />
            </div>
            <div className="sidebar-project-list">
              {projects.map((project, index) => {
                const chats = selectHistory(history, project.id);
                const expanded = expandedProjects.includes(project.id);
                return <ProjectRow key={project.id} project={project} index={index} active={projectState.activeId === project.id} expanded={expanded} onOpen={id => openProject(id, true)} onNewChat={id => {newChat(id, false);navigate('project');}} onAction={actOnProject}>
                    {chats.map(chat=><HistoryRow key={chat.id} chat={chat} compact active={currentChat.current===chat.id} onOpen={openHistory} onAction={actOnHistory}/>)}
                    {!chats.length&&<p>Пока нет чатов</p>}
                </ProjectRow>;
              })}
            </div>
          </section>
          <section className="chat-history">
            <div className="history-label">
              <span>{historyArchived ? 'Архив чатов' : 'История чатов'}</span>
              {(historyArchived || history.some(chat => !chat.projectId && chat.archived)) && <button
                type="button"
                className={`history-archive-toggle${historyArchived ? ' is-active' : ''}`}
                aria-label={historyArchived ? 'Вернуться к истории чатов' : 'Открыть архив чатов'}
                title={historyArchived ? 'Вернуться к истории чатов' : 'Архив чатов'}
                onClick={() => setHistoryArchived(value => !value)}
              ><Icon name={historyArchived ? 'arrowLeft' : 'archive'} size={16}/></button>}
              <IconButton
                icon="search"
                label="Поиск по чатам"
                onClick={() => setSearchOpen((v) => !v)}
              />
            </div>
            {searchOpen && (
              <TextInput
                className="history-search"
                autoFocus
                aria-label="Поиск по чатам"
                placeholder="Найти чат…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
            <div className="history-list">
              {historyEntries
                .filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase()))
                .map((chat) => (
                  <HistoryRow key={chat.id} chat={chat} active={currentChat.current===chat.id} onOpen={openHistory} onAction={actOnHistory}/>
                ))}
            </div>
          </section>
        </div>
        <div className="sidebar-bottom">

          <div className="sidebar-separator" />
          <ProfileMenu account={account} onSection={section => { setSidebarOpen(false); if(section === 'subscription') setBillingOpen(true); else setAccountSection(section); }} onSignOut={() => { setAccount(null); setToast("Вы вышли из демо-аккаунта"); }} onAuth={openAuth} />
        </div>
      </aside>
      <button type="button" className="sidebar-edge-toggle" aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'} aria-controls="mobile-navigation" aria-expanded={!collapsed} tabIndex={-1} title={collapsed ? 'Развернуть меню' : 'Свернуть меню'} onClick={() => setCollapsed(previous => !previous)}/>
      </div>
      <main ref={mainRef} className={"chat-main " + (!studioActive && messages.length ? "has-messages " : "") + (studioActive ? 'has-studio' : '')} inert={isMobile && sidebarOpen}>
        <div className="chat-pane" inert={artifactOpen && !studioActive && (isMobile || artifactFull)}><header className="chat-header">
          <div className="header-start">
            <IconButton
              className="mobile-menu"
              icon="sidebarExpand"
              label="Открыть меню"
              aria-controls="mobile-navigation"
              aria-expanded={sidebarOpen}
              aria-haspopup="dialog"
              onClick={() => setSidebarOpen(true)}
            />
            <ProjectSelect projects={projects} value={projectState.activeId} onChange={openProject} onOpen={openProject} onNew={()=>setNewProjectOpen(true)}/>
            {messages.length > 0 && (
              <IconButton
                className="mobile-menu"
                icon="newChat"
                label="Новый чат"
                onClick={newChat}
              />
            )}
          </div>
          <div className="header-end"><NotificationCenter notifications={notifications} onMarkRead={ids => setNotifications(previous => previous.map(item => ids.includes(item.id) ? {...item,read:true} : item))} onSelect={openNotification} onBilling={() => setBillingOpen(true)}/><div className="coin-balance">
            <button className="balance-value" aria-label="Баланс: 5 молекул. Открыть тарифы" onClick={() => setBillingOpen(true)}>
              <img
                alt=""
                src={sourceAsset("figma-2335-94959", "imgFrame16")}
                width="14"
                height="14"
              />
              <b>
                5<span className="mc-label"> MC</span>
              </b>
            </button>
            <button
              aria-label="Пополнить баланс"
              onClick={() => setBillingOpen(true)}
            >
              <span>Пополнить</span>
              <Icon name="add" size={14} />
            </button>
          </div>
          </div>
        </header>
        <div className="chat-route-content" hidden={studioActive} inert={studioActive} aria-hidden={studioActive || undefined}>
        {conversationRoute === 'project' && activeProject ? <ProjectWorkspace key={activeProject.id} onChatAction={actOnHistory} project={activeProject} index={projects.indexOf(activeProject)} chats={history.filter(chat => chat.projectId === activeProject.id)} onOpenChat={openHistory} onAction={actOnProject}>
          <ChatComposer chatImages={chatImageReferences(messages)} key={composerKey} placeholder={`Новый чат в ${activeProject.name}`} sendOnEnter={preferences.sendOnEnter} onAuth={openAuth} mode={mode} onModeChange={changeMode} model={model} onModelOpen={() => setModelOpen(true)} values={settings} onChange={changeValue} initialText={draft} showFooter showPromo={false} files={files} onFilesChange={setFiles} onSend={send} onStop={stop} onRoleInfo={openRoleInfo}/>
        </ProjectWorkspace> : messages.length === 0 ? (
          <HomeExperience onChoose={chooseHomeExample} resetKey={composerKey} mode={mode}>
          <div className={"empty-chat empty-" + mode}>
            <div className="greeting">
              <h1>
                {mode === "auto"
                  ? "Что сегодня сделаем вместе?"
                  : mode === "image"
                    ? "Привет!"
                    : "Как я могу помочь вам сегодня?"}
              </h1>
              {mode !== "auto" && (
                <p>
                  {mode === "image"
                    ? "Какое изображение сделаем сегодня?"
                    : mode === "text" ? `Идеи для ${model}` : "Спросите меня о чём угодно"}
                </p>
              )}
            </div>
            {mode === "auto" && (
              <div className="mode-suggestions">
                {Object.entries(MODE_NAMES)
                  .filter(([m]) => m !== "auto")
                  .map(([m, title]) => (
                    <button
                      className="pill"
                      key={m}
                      onClick={() => changeMode(m)}
                    >
                      <ModeIcon mode={m} />
                      {title}
                    </button>
                  ))}
              </div>
            )}
            {mode === "image" && (
              <div className="image-examples">
                {imageKeys.map((key, i) => (
                  <button
                    key={key}
                    onClick={() => selectExample(i)}
                    aria-label={examplePrompts[i]}
                  >
                    <img
                      src={sourceAsset("figma-2366-90475", key)}
                      alt={examplePrompts[i]}
                    />
                  </button>
                ))}
              </div>
            )}
            {mode === "text" && <PromptSuggestions model={model} onSelect={prompt => {
              setDraft(prompt);
              setComposerKey(key => key + 1);
              setTimeout(() => document.querySelector('.empty-text textarea')?.focus({ preventScroll: true }), 0);
            }} />}
            <ChatComposer
              chatImages={chatImageReferences(messages)}
              sendOnEnter={preferences.sendOnEnter}
              onAuth={openAuth}
              key={composerKey}
              mode={mode}
              onModeChange={changeMode}
              model={model}
              onModelOpen={() => setModelOpen(true)}
              values={settings}
              onChange={changeValue}
              initialText={draft}
              showFooter={mode !== "auto"}
              showPromo
              files={files}
              onFilesChange={setFiles}
              onSend={send}
              onStop={stop}
              onRoleInfo={openRoleInfo}
              offer={offer}
              onDismissOffer={() => setOffer(false)}
            />
          </div>
          </HomeExperience>
        ) : (
          <>
            <div className="message-scroll" ref={scroll} {...chatScrollHandlers} tabIndex={0} role="region" aria-label="История сообщений">
              <div className="messages">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    id={`message-${message.id}`}
                    className={"message " + message.role}
                  >
                    {message.role === "user" ? (
                      <div className="user-message">
                        <div><PromptText text={message.text} parts={message.prompt?.parts} files={message.files}/></div>
                        {message.files?.length > 0 && (
                          <div className="message-files">
                            {message.files.map((f, i) => (
                              <FileChip key={f.id || i} file={f} onOpen={documentFormat(f) ? () => openArtifact(f) : undefined} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="assistant-avatar">
                          <ModelIcon model={message.model} size={18} />
                        </span>
                        <div className="assistant-content">
                          {message.files?.length > 0 && <div className="message-files">{message.files.map((file, index) => <FileChip key={file.id || index} file={file} onOpen={documentFormat(file) ? () => openArtifact(file) : undefined}/>)}</div>}
                          {message.media && (message.media.type === "audio" ? <AudioResult media={{ ...message.media, id: message.id }} pending={generating && message.id === messages.at(-1)?.id} onPlay={() => openMedia(message.id)} /> : <MediaResult media={{ ...message.media, id:message.id }} pending={generating && message.id === messages.at(-1)?.id} onOpen={media => openMedia(media.id)} />)}
                          {!message.text && !message.media ? (
                            <span className="typing-status">
                              {generating ? <>Думаю<span>…</span></> : "Ответ был остановлен. Отправьте сообщение, чтобы продолжить."}
                            </span>
                          ) : message.text && !message.media ? (
                            <div className="response-text">
                              {message.text.split("\n\n").map((p, i) => (
                                <p key={i}>{p}</p>
                              ))}
                            </div>
                          ) : null}
                          {message.preview && message.text && (
                            <button className="legacy-media-preview" onClick={() => openMedia(message.id)} aria-label="Открыть изображение"><img
                              className="generated-example"
                              src={message.preview}
                              alt="Пример изображения из макета"
                            /></button>
                          )}
                          {!message.media && (!generating ||
                            message.id !== messages.at(-1)?.id) && (
                            <div className="message-actions">
                              <IconButton
                                icon="like"
                                label="Хороший ответ"
                                onClick={() =>
                                  setToast("Спасибо за обратную связь")
                                }
                              />
                              <IconButton
                                icon="dislike"
                                label="Плохой ответ"
                                onClick={() =>
                                  setToast(
                                    "Оценка сохранена в этой демонстрации",
                                  )
                                }
                              />
                              <IconButton
                                icon="copy"
                                label="Скопировать ответ"
                                onClick={() => copy(message.text)}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </article>
                ))}
                <div ref={end} />
              </div>
            </div>
            <div className="chat-composer-dock">
              <ChatComposer
              chatImages={chatImageReferences(messages)}
              sendOnEnter={preferences.sendOnEnter}
              onAuth={openAuth}
                key={composerKey}
                mode={mode}
                onModeChange={changeMode}
                model={model}
                onModelOpen={() => setModelOpen(true)}
                values={settings}
                onChange={changeValue}
                generating={generating}
                hasConversation
                initialText={draft}
                showFooter
                showPromo={false}
                showTopPanel={Boolean(settings.role)}
                files={files}
                onFilesChange={setFiles}
                onSend={send}
                onStop={stop}
                onRoleInfo={openRoleInfo}
              />
            </div>
          </>
        )}
        </div>
        {visitedStudios.includes('carousel') && <div className="studio-route-content" hidden={contentRoute !== 'carousel'} inert={contentRoute !== 'carousel'} aria-hidden={contentRoute !== 'carousel' || undefined}><CarouselStudio active={contentRoute === 'carousel'} openResultId={studioResultIds.carousel} onResultOpened={() => setStudioResultIds(previous => ({...previous, carousel: undefined}))} onNotify={setToast} onComplete={result => completeStudio('carousel', result)}/></div>}
        {visitedStudios.includes('trends') && <div className="studio-route-content" hidden={contentRoute !== 'trends'} inert={contentRoute !== 'trends'} aria-hidden={contentRoute !== 'trends' || undefined}><TrendsStudio active={contentRoute === 'trends'} openResultId={studioResultIds.trends} onResultOpened={() => setStudioResultIds(previous => ({...previous, trends: undefined}))} onNotify={setToast} onComplete={result => completeStudio('trends', result)}/></div>}

      </div>
        <ArtifactPanel file={artifact} open={artifactOpen && !studioActive} onClose={() => setArtifactOpen(false)} full={artifactFull} onFullChange={setArtifactFull} mobile={isMobile} />
      </main>
      {route === 'roles' && <RolesShowcase onSelectRole={(role,prompt) => {chooseRole(role,prompt);}} onClose={() => navigate(rolesReturnRoute)} onBack={() => navigate(rolesReturnRoute)}/>}
      {billingOpen && <BillingModal balance={5} onClose={() => setBillingOpen(false)}/>}
      {projectAction && <ProjectActionDialog key={projectAction.project.id + projectAction.action} {...projectAction} index={projects.findIndex(project => project.id === projectAction.project.id)} existingNames={projects.filter(project => project.id !== projectAction.project.id).map(project => project.name)} onClose={() => setProjectAction(null)} onSave={updateProject} onDelete={deleteProject} onAction={actOnProject}/>}
      {authOpen && <Suspense fallback={null}><AuthModal mode={mode} onClose={() => setAuthOpen(false)} onSuccess={next => { setAccount(next); setAuthOpen(false); setToast("Демо-профиль готов"); }} /></Suspense>}
      {accountSection && <AccountPanel key={accountSection} section={accountSection} account={account} preferences={preferences} onSaveAccount={next => { setAccount(next); setToast("Профиль сохранён"); }} onPreferencesChange={setPreferences} onClose={() => setAccountSection(null)} onExplore={next => { newChat(); changeMode(next); }} onAuth={openAuth} />}
      {modelOpen && (
        <ModelPicker
          mode={mode}
          model={model}
          onSelect={(m, name) => {
            if (m !== mode) changeMode(m);
            setModels((p) => ({ ...p, [m]: name }));
          }}
          onClose={() => setModelOpen(false)}
        />
      )}
      {historyAction && <HistoryDialog key={historyAction.chat.id + historyAction.action} {...historyAction} projects={projects} onClose={() => setHistoryAction(null)} onSave={saveHistoryAction}/>}
      {newProjectOpen&&<ProjectDialog existingNames={projects.map(project=>project.name)} onClose={()=>setNewProjectOpen(false)} onCreate={createProject}/>}
      {roleOpen && (
        <RolesShowcase
          initialRole={inspectedRole || settings.role}
          onClose={() => setRoleOpen(false)}
          onSelectRole={(role, prompt) => {
            changeValue("role", role);
            if (typeof prompt === "string") {
              setDraft(prompt);
              setComposerKey(k => k + 1);
            }
            setRoleOpen(false);
          }}
        />
      )}
      {examplesOpen && (
        <div className="simple-overlay" onClick={() => setExamplesOpen(false)}>
          <section
            className="examples-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2>Попробуйте прямо сейчас</h2>
              <IconButton
                icon="close"
                label="Закрыть примеры"
                onClick={() => setExamplesOpen(false)}
              />
            </header>
            {HISTORY.slice(0, 6).map((title, i) => (
              <button
                key={title}
                onClick={() => {
                  setDraft(
                    i === 0 ? "Придумай 5 вирусных фактов о верблюдах" : title,
                  );
                  setComposerKey((k) => k + 1);
                  setExamplesOpen(false);
                }}
              >
                {title}
                <Icon name="arrowRight" />
              </button>
            ))}
          </section>
        </div>
      )}
      {viewerId && <Suspense fallback={null}><MediaViewer items={readyMedia.filter(media => media.type !== "audio")} initialId={viewerId} onClose={() => setViewerId(null)} onReuse={media => chooseHomeExample({ mode: media.type, model: media.model, prompt: media.title, settings:media.settings })} /></Suspense>}
      {audioId && <Suspense fallback={null}><AudioPlayer items={audioQueue} currentId={audioId} onSelect={setAudioId} onClose={() => setAudioId(null)} inert={isMobile && sidebarOpen} /></Suspense>}
      {(toast || deletedChat) && (
        <div className="app-toast" role="status">
          {deletedChat ? 'Чат удалён' : toast}
          {deletedChat && <button className="toast-undo" onClick={undoDelete}>Отменить</button>}
          <button aria-label="Закрыть уведомление" onClick={() => { setToast(''); setDeletedChat(null); }}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
