<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (Hexloo game)

- Game rules, prices, odds and timers live as pure functions/data in `src/game/*` and are covered by `src/game/__tests__`; UI only calls them. Why: rules stay testable without React.
- All player progress is saved in browser localStorage through `src/game/store.ts` (one key, migrated on load); uploaded pictures use separate keys via `src/game/images.ts`. Why: the game must work fully offline with no backend.
- Background pictures are bundled 1920px square `.webp` files (plus 288x504 `-thumb` shop pictures) in `src/assets/bg/` resolved by `src/game/backgrounds.ts`, and the PWA precaches them. Why: offline play needs every scene cached, and square hi-res art stays sharp unblurred on phones, iPads and laptops alike.
- Each game `<svg>` gets its own gradient/texture ids via `TileDefs`/`useSvgPrefix` (`hexgeo.tsx`); never use fixed SVG ids. Why: many previews render on one page.
- The offline service worker registers only from `src/lib/pwa.ts`. Why: it must never run in previews or iframes.
- Hard Mode runs on its own `/hard` route with its own saved run (`hardRun`), separate from the normal `board`. Why: normal endless play must never be affected by Hard Mode rules.
- Device vibration only goes through `src/game/haptics.ts`, which checks the player's Vibration setting. Why: one switch must silence every vibration.
- The 2x/3x coin ad buttons, reward videos and play-time clock live in `src/components/game/CoinAds.tsx` and are used by every game mode. Why: Play and Hard Mode must behave identically for boosts.
- Bigger screens scale through the root font size (md+ in `src/styles.css`), so UI sizes use rem, not px; the board fits its space by height on md+. Why: phones keep their exact sizing while iPads/laptops grow.
- The first-game hint is driven by `tutorialDone` in the player save (old saves with progress skip it) and the board's `hint` prop; Play marks it done on the first move. Why: it must show once, never block play, and never reappear.
