# Survey Navigator

## Goal

Let visitors jump quickly to published portfolio sections and records through one searchable, keyboard-accessible navigator.

## Design

Add a compact navigator button to the existing observatory header. `Ctrl/Cmd+K` and `/` open the same native dialog. Search covers the seven section labels, published expertise skills, published projects, and published credentials. It matches every query word against record titles and relevant context, including project descriptions and technologies plus credential skills and dates. Each result displays its type and useful context, and links to the existing section or record hash.

The dialog uses native modal focus handling and Escape behavior. Arrow keys move through results, Enter opens the first match, and an empty query shows the full index. The slash shortcut is ignored while typing in editable controls. Its result list opts out of Lenis wheel interception so it can scroll independently. Re-selecting a project or credential invokes its existing navigation behavior even when its hash is already active. The feature adds no dependency and reuses the current design tokens and record data.

## Acceptance

- Search filters every supported result type case-insensitively across its title and metadata; multiword searches match when each word appears somewhere in the record.
- Keyboard shortcuts open the navigator without intercepting text entry.
- Selecting a result closes the dialog and preserves the existing deep-link behavior.
- Re-selecting the active project or credential still opens and focuses its record.
- The result list scrolls without moving the page behind the modal.
- Result counts and zero matches are announced to assistive technology; the trigger exposes its keyboard shortcuts.
- No results are communicated clearly, and the result list remains keyboard accessible.
- Lint and production build pass.
