import React, { useEffect, useRef, useState } from "react";
import { Lightbulb, ChevronsUp } from 'lucide-react';
import { Icon, ModeIcon, ModelIcon } from "../ui.jsx";
import { homeBanners, homeCollections, homeModels } from "./home-content.js";
import "./home-experience.css";

function ExampleCard({ item, onChoose }) {
  const videoRef = useRef(null);
  const preview = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    videoRef.current?.play().catch(() => {});
  };
  const pause = () => videoRef.current?.pause();
  return (
    <button
      className={`home-example home-example-${item.mode}`}
      type="button"
      onClick={() => onChoose(item)}
      onMouseEnter={preview}
      onMouseLeave={pause}
      onFocus={preview}
      onBlur={pause}
    >
      <img src={item.image} alt="" loading="lazy" draggable={false} />
      {item.video && (
        <video
          ref={videoRef}
          src={item.video}
          poster={item.image}
          muted
          playsInline
          loop
          preload="none"
          aria-hidden="true"
        />
      )}
      <span className="home-example-kind">
        <ModeIcon mode={item.mode} size={16} />
        <span>
          {item.mode === "image"
            ? "Изображение"
            : item.mode === "video"
              ? "Видео"
              : "Аудио"}
        </span>
      </span>
      <span className="home-example-copy">
        <strong>{item.title}</strong>
        <span>{item.description}</span>
      </span>
    </button>
  );
}

function Collection({ collection, onChoose }) {
  const listRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => {
    const list = listRef.current;
    if (!list) return;
    const next = {
      start: list.scrollLeft <= 2,
      end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 2,
    };
    setEdges((old) =>
      old.start === next.start && old.end === next.end ? old : next,
    );
  };
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    observer.observe(listRef.current);
    measure();
    return () => observer.disconnect();
  }, []);
  const move = (direction) =>
    listRef.current?.scrollBy({
      left: direction * listRef.current.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });

  return (
    <section
      className="home-collection"
      aria-labelledby={`home-${collection.id}`}
    >
      <div className="home-section-heading">
        <div>
          <h2 id={`home-${collection.id}`}>{collection.title}</h2>
          <p>{collection.description}</p>
        </div>
        <div className="home-row-controls">
          <button
            type="button"
            className="pill round"
            aria-label={`Предыдущие примеры: ${collection.title}`}
            disabled={edges.start}
            onClick={() => move(-1)}
          >
            <Icon name="chevron" size={14} />
          </button>
          <button
            type="button"
            className="pill round"
            aria-label={`Следующие примеры: ${collection.title}`}
            disabled={edges.end}
            onClick={() => move(1)}
          >
            <Icon name="chevron" size={14} />
          </button>
        </div>
      </div>
      <div className="home-example-row" ref={listRef} onScroll={measure}>
        {collection.items.map((item) => (
          <ExampleCard key={item.title} item={item} onChoose={onChoose} />
        ))}
      </div>
    </section>
  );
}

export function HomeExperience({ children, onChoose, resetKey, mode = 'auto' }) {
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const launchRef = useRef(null);
  const scrollTimer = useRef(null);
  const focusTimer = useRef(null);
  const cancelScroll = () => { clearTimeout(scrollTimer.current); clearTimeout(focusTimer.current); scrollTimer.current = null; };
  const goTo = top => {
    cancelScroll();
    const element = scrollRef.current;
    if (!element) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.dataset.input === "keyboard") { element.scrollTo({ top, behavior: "instant" }); return; }
    const start = element.scrollTop, started = performance.now();
    const step = () => {
      const progress = Math.min(1, (performance.now() - started) / 420);
      element.scrollTo({ top: start + (top - start) * (1 - (1 - progress) ** 3), behavior: "instant" });
      if (progress < 1) scrollTimer.current = setTimeout(step, 16);
    };
    step();
  };
  useEffect(() => cancelScroll, []);
  const geometry = useRef({ distance: 300, startWidth: 776, endWidth: 1160 });
  useEffect(() => { cancelScroll(); scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [resetKey, mode]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const { distance, startWidth, endWidth } = geometry.current;
      const progress = Math.max(0, Math.min(scroller.scrollTop / distance, 1));
      if (launchRef.current) {
        launchRef.current.style.opacity = Math.max(0, 1 - progress * 5);
        launchRef.current.style.visibility = progress >= .2 ? "hidden" : "visible";
      }
      scroller.style.setProperty("--home-progress", progress.toFixed(4));
      scroller.style.setProperty("--home-hero-shift", `${-160 * progress}px`);
      scroller.style.setProperty(
        "--home-hero-opacity",
        String(1 - 0.68 * progress),
      );
      scroller.style.setProperty(
        "--home-hint-opacity",
        String(Math.max(0, 1 - progress * 3)),
      );
      scroller.style.setProperty(
        "--home-hint-visibility",
        progress >= 1 / 3 && !preference.matches ? "hidden" : "visible",
      );
      scroller.style.setProperty("--home-content-shift", `${-40 * progress}px`);
      scroller.style.setProperty(
        "--home-sheet-width",
        `${preference.matches ? endWidth : startWidth + (endWidth - startWidth) * progress}px`,
      );
      const channel = Math.round(247 + 8 * progress);
      scroller.style.setProperty(
        "--home-sheet-color",
        `rgb(${channel},${channel},${channel})`,
      );
    };
    const measure = () => {
      const height = scroller.clientHeight;
      const width = scroller.clientWidth;
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const heroHeight =
        heroRef.current?.firstElementChild?.offsetHeight || 310;
      const heroBottom =
        height / 2 + (mobile ? 1.5 : -30) + heroHeight / 2 - 160;
      const curtainHeight = mobile ? 44 : 52;
      const distance = Math.max(120, height - curtainHeight - heroBottom);
      geometry.current = {
        distance,
        startWidth: Math.min(776, width - 32),
        endWidth: Math.min(1160, width - (mobile ? 0 : 32)),
      };
      scroller.style.setProperty("--home-viewport-height", `${height}px`);
      scroller.style.setProperty("--home-travel", `${distance}px`);
      apply();
    };
    const scroll = apply;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (heroRef.current?.firstElementChild)
      observer.observe(heroRef.current.firstElementChild);
    scroller.addEventListener("scroll", scroll, { passive: true });
    preference.addEventListener("change", measure);
    measure();
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", scroll);
      preference.removeEventListener("change", measure);
    };
  }, []);

  const explore = () => goTo(geometry.current.distance);

  return (
    <div className="home-experience-shell">
    <div
      className="home-experience"
      onWheel={cancelScroll}
      onTouchStart={cancelScroll}
      ref={scrollRef}
      aria-label="Главная и идеи для творчества"
    >
      <div className="home-stage">
        <div className="home-hero">
          <div className="home-hero-inner" ref={heroRef}>
            {children}
          </div>
        </div>
      </div>
      <div className="home-curtain-wrap">
        <div className="home-curtain">
          <div className="home-curtain-spacer" aria-hidden="true" />
          <div className="home-curtain-content">
            <div className="home-featured">
              {homeBanners.map((item) => (
                <button
                  className="home-featured-card"
                  type="button"
                  key={item.title}
                  onClick={() => onChoose(item)}
                >
                  <img src={item.image} alt="" loading="lazy" />
                  <span className="home-featured-model">
                    <ModelIcon model={item.model} size={16} />
                    {item.model}
                  </span>
                  <span className="home-featured-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <section
              className="home-model-section"
              aria-labelledby="home-models-title"
            >
              <div className="home-section-heading">
                <div>
                  <h2 id="home-models-title">С чего хотите начать?</h2>
                  <p>Знакомые модели для самых разных задач</p>
                </div>
              </div>
              <div className="home-model-grid">
                {homeModels.map((item) => (
                  <button
                    className="home-model-card"
                    type="button"
                    key={item.model}
                    onClick={() => onChoose(item)}
                  >
                    <ModelIcon model={item.model} size={28} />
                    <strong>{item.model}</strong>
                    <span>{item.description}</span>
                  </button>
                ))}
              </div>
            </section>
            {homeCollections.map((collection) => (
              <Collection
                key={collection.id}
                collection={collection}
                onChoose={onChoose}
              />
            ))}
            <div className="home-bottom-note">
              <span>Ваша следующая идея уже где-то рядом</span>
              <button
                className="pill"
                type="button"
                onClick={() => { goTo(0); focusTimer.current = setTimeout(() => heroRef.current?.querySelector("[data-composer-input]")?.focus({ preventScroll: true }), 450); }}
              >
                {mode === 'auto' ? 'Вернуться к Молли' : 'Вернуться к запросу'}
                <Icon name="send" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
          <button
            type="button"
            ref={launchRef}
            className="home-curtain-handle home-curtain-launch"
            onClick={explore}
            aria-label="Посмотреть идеи и примеры"
          >
            <span className="home-curtain-grabber" />
            <span>
              <Lightbulb className="curtain-bulb" size={18} aria-hidden="true" strokeWidth={1.75}/>
              Немного вдохновения
            </span>
            <span className="home-curtain-hint">
              Листайте дальше
              <ChevronsUp className="curtain-arrow" size={14} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </button>
    </div>
  );
}
