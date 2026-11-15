/** Shared class names for links and buttons (style guide §4, docs/design/style-guide.md). */

/** Header / menu link: the underline grows from the left on hover (`.link-underline` in globals.css). */
export const navLink =
  "link-underline inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand";

/** Movement shared by every button: colours fade, and the button dips slightly while it is pressed. */
const buttonMotion = "transition duration-200 active:scale-[0.97]";

export const primaryButton = `inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${buttonMotion}`;

export const secondaryButton = `inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-foreground hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${buttonMotion}`;

/** Section heading on public pages: small label + serif title (home page, list page). */
export const sectionTitle = "text-3xl leading-tight font-medium md:text-4xl";
