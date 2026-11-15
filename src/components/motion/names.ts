/**
 * `view-transition-name` shared by the clicked cover on a book card and the large cover on the detail page.
 * The browser animates between the two elements that carry this name (see CoverTransition and globals.css).
 * Kept in its own file so both server components (detail page) and client components can import it.
 */
export const COVER_TRANSITION_NAME = "book-cover";
