# Carousel and Trends verification — 20 September 2026

## Automated checks

- `pnpm test`: 108 tests passed, zero failures.
- `pnpm build`: passed; Sites packaging retained. Vite reports the existing large-chunk warning.
- `git diff --check`: passed.
- Added coverage for route/draft preservation, carousel validation, semantic and long-text splitting, request snapshots, edited result history, variant text preservation, ZIP integrity, upload validation, camera transforms, aborts and WebM duration metadata.

## Browser checks

- Tested desktop 1280×720 and 1600×1000, and mobile 390×844.
- Sidebar collapse control and header actions remain at vertical center y=60 on desktop, expanded and collapsed. Collapsed rail retains navigation and profile. Invisible edge toggles the sidebar; no vertical divider is visible. Tools is absent from navigation.
- Mobile drawer retains page shift, rounding, dimming and blur. At 390px the carousel page and its scroll container remain 390px wide, with no horizontal overflow.
- Carousel uses the Trends layout on desktop: settings on the left, references on the right. Mobile390px uses two separate steps in a 350px column; page and workspace remain 390px without horizontal overflow. The selected check remains inside its cover.
- Greeting, Carousel and Trends headings have identical computed typography: Geist, weight 600, 28px desktop /24px mobile.
- Custom style requires a description and supports zero photos. Generated a three-slide typography carousel, then uploaded five photos, reloaded, removed/replaced one, generated five 1080×1920 PNG slides and made another variant. All five photo thumbnails, the description and settings survived reload/variant reuse. A six-photo batch is rejected without adding partial attachments.
- Empty brief validation works. Generated four 1080×1080 PNG slides and three 1080×1920 PNG slides. Edited the cover, created another variant and verified the text remains unchanged.
- Downloaded an actual four-file carousel ZIP through the browser; `unzip -t` reported no compressed-data errors.
- Uploaded a generated portrait, selected camera movement and added a caption. Produced and downloaded a real 720×1280 video. The shared player reports a finite 6-second duration and plays; navigating away pauses playback.
- Uploaded photo and saved video survived reload. Completion notifications open the corresponding studio result.
- Final console check found an empty-image-source warning while restoring a saved video thumbnail. Guarded the initial source; repeating the history flow emitted no new errors.

## Generation scope

This is the existing local prototype architecture. Carousel output is deterministic typography/image composition: full supplied text is laid out, while a short topic produces an outline. Final output is read-only; source text can be changed before a new generation. Trends applies camera movement to the uploaded photograph and records actual video. AI copywriting, per-topic image generation and transfer of body movement from a video reference still require a generation service. The UI does not substitute an unrelated video as an apparent character-transfer result.

Asset paths and exact built-in imagegen prompts are recorded in `carousel-image-prompts.md` and `trends-image-prompts.md`.

## Catalog, costs and sidebar refinements

- Added 16 separately generated imagegen backgrounds, bringing the ready catalog to 20. Browser loaded all 20 PNGs; asset validation checks their headers and portrait resolution. The first additional card is «Свой стиль», for 21 choices total.
- Desktop forms stick below the header; only fields scroll internally while the action footer remains visible. At 390×844 the form returns to normal page flow on step2, with its action bar fixed to the bottom. Selecting a style keeps step1 open until the user presses «Далее».
- Carousel estimates update from 750 MC (3 slides) to 2500 MC (10 slides); Trends updates from 500 MC at 720p to 1000 MC at 1080p. Both buttons display a white mask of the balance brand icon. Estimates are local and do not debit the balance.
- Generated a new three-slide 1080×1920 carousel using «Неон»; the rendered PNG preview loads with readable light text over the new dark artwork.
- Project icons use colored Lucide Folders outlines. PanelLeft/PanelRight render at 17px for the former 20px controls and use strokeWidth 1.75, matching SquarePlus after the latest user correction.
- Hovered the expanded logo in-browser: computed background is fully transparent. The collapsed logo/expand control also has no hover background.

## Studio tabs and mobile steps

- Carousel uses the shared Tabs component for «Шаблоны» and «Мои карусели», with a saved-work count. Browser verified actual generated covers and opening saved work in the shared MediaViewer. Generated output is read-only after the latest user request; there are no edit or variant actions.
- On mobile390×844 and320×720, selecting a card keeps step1 open; «Далее» remains at the viewport bottom even at the last gallery card. Step2 hides the gallery and displays settings with a fixed «Начать генерацию» action. Back/next preserves the style description, all five reference photos, text and parameters. History and results have no generation footer. Both steps show only the selected template name above the fixed action.
- Trends prevents «Далее» without a selected template. Changing quality, returning to selection and continuing preserves the photo, caption and quality. The mobile action generated a valid six-second720p video; a separate generation was cancelled from the fixed bar.
- A three-slide custom carousel generated successfully from mobile step2 and appeared in the history with a working download action.
- Desktop1280×720: scrolled custom settings by606px while the action footer retained the same position. At768×720, the form and footer fit before any page scroll and the studio has no horizontal overflow. The footer stays separate from fields in both studios.

## Shared history viewer

- Both histories open the shared MediaViewer. A saved 720p video plays with a finite six-second duration, a correct `.webm` download filename, and returns to «Мои видео» after Escape.
- Carousel viewer shows the real 1080×1920 PNGs, updates the counter and filename while navigating, and supports zoom. Individual PNG and full ZIP download actions were exercised. No text inputs, textareas, or edit actions remain in the viewer.
- Closing a carousel returns to «Мои карусели» without replacing its draft. The viewer is gated by the active route so hidden studios cannot leave a modal over another page.
- A fresh five-slide custom generation opened directly in the read-only viewer (`1 / 5`, zero editable fields). The ninth saved carousel and all five draft references survived a page reload.
- Earlier editor/variant checks above document the previous iteration; those controls have now been removed at the user’s request. Saved data from that iteration remains viewable.

## Lucide migration

- Installed lucide-react 1.47.0 through pnpm; pnpm and npm lockfiles synchronized. Removed unused Gravity and Phosphor packages.
- Shared icons, settings, model checks, navigation, notifications, role actions, upload controls, projects, sharing and players now use matching Lucide icons at strokeWidth 1.75. Brand logos remain original assets.
- Browser verified sidebar PanelLeft and Trends Clapperboard strokes match. Favorite stars render primary-filled; active hearts render red-filled with no leftover SVG masks.
- Scope-binding audit across 68 source modules finds no unbound JSX component identifiers. A missed download import on the carousel result was found during browser generation and fixed; repeated generation and variant flows render successfully.
- Browser checked the main settings popover and model picker: attachment, speed, role, search, research and model selection icons render correctly; the selected-model check retains primary color.
