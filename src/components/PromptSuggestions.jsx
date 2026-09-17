import React from "react";
import { Icon } from "../ui.jsx";
import { getPromptSuggestions } from "./prompt-suggestions.js";
import "./prompt-suggestions.css";

export function PromptSuggestions({ model = "GPT-5", onSelect }) {
  return (
    <section
      className="prompt-suggestions"
      aria-label={`Идеи запросов для ${model}`}
    >
      {getPromptSuggestions(model).map(({ title, description, prompt }) => (
        <button
          type="button"
          className="prompt-suggestion"
          key={prompt}
          onClick={() => onSelect?.(prompt)}
        >
          <span className="prompt-suggestion-copy">
            <span className="prompt-suggestion-title">{title}</span>
            <span className="prompt-suggestion-description">{description}</span>
          </span>
          <Icon name="external" size={12} />
        </button>
      ))}
    </section>
  );
}
