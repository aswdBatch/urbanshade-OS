

# V3.5.1 Update: App Polish, Desktop Experience & UUR Improvements

## 1. UUR App Overhaul
**File:** `src/components/apps/UURApp.tsx`

- **GUI mode redesign**: Replace the flat list layout with category tabs/filters using `UUR_CATEGORIES`, so users can browse by App, Game, Utility, etc.
- **Package detail view**: Clicking a package opens a detail panel showing description, author, version, download count, stars, tags, and dependencies
- **Search in GUI mode**: Wire up the existing search input (currently non-functional) to actually filter packages
- **Install progress animation**: Add a brief progress bar/spinner during install instead of instant swap
- **Better empty states**: Show illustration + message when no packages found or none installed

## 2. Taskbar Polish
**File:** `src/components/Taskbar.tsx`

- **Window thumbnail previews**: Expand the tooltip hover cards to show a mini colored preview placeholder (app accent color) instead of just text labels
- **Drag-to-reorder**: Allow dragging open app icons on the taskbar to reorder them
- **Grouped window count badge**: Show a small count badge (e.g., "3") on grouped app icons instead of just dots
- **Active app underline**: Add a subtle animated underline indicator for the currently focused window's icon

## 3. Context Menu Upgrade
**File:** `src/components/ContextMenu.tsx`

- **Submenu support**: Add expandable submenus (e.g., "New >" with File, Folder options)
- **Keyboard shortcuts labels**: Show shortcut hints (e.g., "Ctrl+R") next to menu items
- **Icon support**: Add icons to context menu items for faster visual scanning

## 4. App Polish Pass
Quick improvements across several existing apps:

- **Terminal** (`Terminal.tsx`): Add command history with Up/Down arrow navigation if not already present
- **Calculator** (`Calculator.tsx`): Add keyboard input support for numbers and operators
- **Notepad** (`Notepad.tsx`): Add word count in status bar, unsaved changes indicator

## 5. Version Bump
- Bump to V3.5.1 "Refined" in `src/lib/version.json`
- Add changelog entry for these improvements

---

### Suggested implementation order
1. UUR GUI overhaul (biggest user-facing change)
2. Taskbar active indicator + count badges (quick wins)
3. Context menu icons + shortcut labels
4. App polish pass
5. Version bump + changelog

