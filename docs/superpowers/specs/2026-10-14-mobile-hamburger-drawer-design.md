# Mobile Hamburger Drawer for AdminShell + SuperAdmin

**Date:** 2026-10-14
**Status:** Approved
**Scope:** GarageOwner (`AdminShell`) and SuperAdmin pages

## Problem

The GarageOwner sidebar (`src/pages/Admin/AdminShell.tsx`) renders its desktop
`<aside>` with `hidden md:flex`, so below 768px there is no sidebar at all —
mobile users only get a horizontally scrollable chip strip, and the shell has
no hamburger button. `SuperAdminDashboardPage.tsx` duplicates the same pattern.
The customer-facing `AppShell`/`AppSidebar` already ship a working mobile
drawer; the admin roles never got one.

## Goal

Add a hamburger button (mobile) that opens the existing sidebar as an
off-canvas drawer on viewports below 768px, for both `AdminShell` and
`SuperAdminDashboardPage`. Replace the mobile chip strip with this drawer.

## Approach

**Single-aside drawer (Approach A):** the existing desktop `<aside>` becomes
dual-mode instead of adding a second nav. Transform classes make it slide in
on mobile; a `md:` override pins it visible on desktop. No new components, no
duplicated nav markup.

Rejected alternatives: shared `NavDrawer` component (more code today; extract
later if a third role needs it), duplicated off-canvas aside (copy-paste drift).

## Changes

### 1. Sticky mobile header (both files)

First child of the root `<div>`:

- `md:hidden` bar: hamburger button (`menu` Material icon,
  `aria-label="Mở menu"`, `aria-expanded={isSidebarOpen}`) + Servio logo/title.
- Click toggles new state `const [isSidebarOpen, setIsSidebarOpen] = useState(false)`.

### 2. Desktop `<aside>` becomes the drawer (both files)

Replace `hidden ... md:flex` with:

```
fixed inset-y-0 left-0 z-[70] flex w-60 flex-col
border-r border-outline-variant bg-surface-container-lowest p-lg
transition-[transform,visibility] duration-300 ease-in-out
+ (isSidebarOpen ? "translate-x-0" : "-translate-x-full invisible")
+ " md:translate-x-0 md:visible"
```

- Mobile closed: fully off-canvas and `invisible` (removed from tab order —
  CSS-only, avoids `inert` which would break the desktop rail).
- Mobile open: slides in.
- Desktop (≥768px): always visible via `md:translate-x-0 md:visible`.
- Verify global CSS at `src/styles/index.css:330-406` (forces `w-60` asides to
  a 72px hover-expand rail on desktop) does not override transform/visibility.

### 3. Backdrop (both files)

`fixed inset-0 z-[60] bg-black/50 md:hidden`, rendered only while
`isSidebarOpen`; click closes.

### 4. Behavior (both files)

- Body scroll lock: `document.body.classList.toggle("overflow-hidden", isSidebarOpen)`
  in an effect (same as customer `AppSidebar`).
- `useDialogA11y(isOpen, drawerRef, onClose)` — Escape closes, focus trap.
- Every nav item click closes the drawer, then runs the existing
  tab-click / navigation handler.
- Mobile chip strip (`md:hidden` block, including its logout chip) is deleted;
  logout already exists in the aside.

### Unchanged

- Desktop ≥768px: hover-expand icon rail controlled by `index.css:330-406`.
- Routing, tab props, notices/toasts, page content.

## Files touched

| File | Change |
|---|---|
| `src/pages/Admin/AdminShell.tsx` | state, mobile header, backdrop, aside transform, close-on-navigate, delete chip strip |
| `src/pages/SuperAdmin/SuperAdminDashboardPage.tsx` | same |

No new files. Reuses `src/hooks/useDialogA11y.ts`.

## Verification

Repo has no test framework (`package.json` has no test script).

1. `npm run lint`
2. `npm run build` (runs `tsc -b`)
3. Manual (`npm run dev`), viewport <768px: hamburger opens drawer; backdrop /
   Escape close it; nav + logout work; scroll locked while open.
4. Manual, ≥768px: desktop rail unchanged; hamburger hidden.

## Known ceiling

Opening the drawer then resizing to desktop leaves scroll locked until closed
— identical to the existing customer `AppSidebar` behavior; accepted for parity.
