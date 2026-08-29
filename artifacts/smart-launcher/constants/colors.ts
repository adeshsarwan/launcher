/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0a0a0a',
    tint: '#2f95dc',

    // Core surfaces
    background: '#F7F8FC',
    foreground: '#202A45',

    // Cards / elevated surfaces
    card: '#F0F2F7',
    cardForeground: '#202A45',

    // Primary action color (buttons, links, active states)
    primary: '#7383B8',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E9ECF8',
    secondaryForeground: '#39445F',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E8EBF2',
    mutedForeground: '#8790A8',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FFD275',
    accentForeground: '#202A45',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#DDE1EA',
    input: '#DDE1EA',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
