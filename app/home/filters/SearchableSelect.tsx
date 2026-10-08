"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { matchesAnySearchWord } from "../../lib/searchWords";
import { FilterIcon } from "./FilterIcon";
import styles from "./Filters.module.css";

type Props = {
  label: string;
  labelledBy: string;
  placeholder: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  allowCustom?: boolean;
  searchInside?: boolean;
  maxSelections?: number;
  chevron?: "chevronDown" | "chevronRight";
  matchAnyWord?: boolean;
  portalRootId?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export function SearchableSelect({
  label, labelledBy, placeholder, options, value, onChange,
  multiple = false, allowCustom = false, searchInside = false,
  maxSelections, chevron = "chevronDown",
  matchAnyWord = false,
  portalRootId = "filters-popovers",
}: Props) {
  const id = useId();
  const listId = `${id}-options`;
  const helpId = `${id}-help`;
  const [open, setOpen] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [present, setPresent] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLInputElement | HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = new Set(value.map(normalize));
  const pool = [...options, ...value.filter((item) => !options.some((option) => normalize(option) === normalize(item)))];
  const matches = pool.filter((item) => matchAnyWord
    ? matchesAnySearchWord(item, query) : normalize(item).includes(normalize(query)));
  const custom = allowCustom && !!query.trim() && !pool.some((item) => normalize(item) === normalize(query));
  const choices = custom ? [...matches, query.trim()] : matches;
  const limitReached = maxSelections !== undefined && value.length >= maxSelections;
  const highlighted = Math.min(activeIndex, Math.max(0, choices.length - 1));

  const openMenu = useCallback((browseOnly = false) => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    setQuery("");
    setActiveIndex(0);
    setBrowsing(browseOnly);
    setPresent(true);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPresent(false), 160);
  }, []);

  const restoreControlFocus = useCallback(() => {
    const control = browsing ? arrowRef.current : controlRef.current;
    control?.focus({ preventScroll: true });
  }, [browsing]);

  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)
        && !popupRef.current?.contains(event.target)) closeMenu();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu();
      restoreControlFocus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, closeMenu, restoreControlFocus]);

  useLayoutEffect(() => {
    if (!open) return;
    const placePopup = () => {
      const anchor = fieldRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const scrollArea = anchor.closest("[data-filter-scroll]");
      const visible = scrollArea?.getBoundingClientRect();
      if (visible && (rect.bottom < visible.top || rect.top > visible.bottom)) {
        closeMenu();
        return;
      }
      const height = window.visualViewport?.height ?? window.innerHeight;
      const viewportTop = window.visualViewport?.offsetTop ?? 0;
      // Keep menus clear of the panel header, pinned actions and on-screen keyboard.
      const bottomBoundary = Math.min(height + viewportTop - 12, visible?.bottom ?? window.innerHeight - 12);
      const topBoundary = Math.max(viewportTop + 12, visible?.top ?? 12);
      const below = bottomBoundary - rect.bottom - 8;
      const above = rect.top - topBoundary - 8;
      const upwards = below < 200 && above > below;
      setPosition({
        left: rect.left,
        width: rect.width,
        top: upwards ? undefined : rect.bottom + 8,
        bottom: upwards ? window.innerHeight - rect.top + 8 : undefined,
        maxHeight: Math.min(300, Math.max(100, upwards ? above : below)),
      });
    };
    placePopup();
    if (searchInside && !browsing) searchRef.current?.focus({ preventScroll: true });
    window.addEventListener("resize", placePopup);
    window.addEventListener("scroll", placePopup, true);
    window.visualViewport?.addEventListener("resize", placePopup);
    window.visualViewport?.addEventListener("scroll", placePopup);
    return () => {
      window.removeEventListener("resize", placePopup);
      window.removeEventListener("scroll", placePopup, true);
      window.visualViewport?.removeEventListener("resize", placePopup);
      window.visualViewport?.removeEventListener("scroll", placePopup);
    };
  }, [open, searchInside, browsing, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const option = list?.children[highlighted];
    if (!(option instanceof HTMLElement) || !list) return;
    const optionRect = option.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (optionRect.top < listRect.top) list.scrollTop -= listRect.top - optionRect.top;
    else if (optionRect.bottom > listRect.bottom) list.scrollTop += optionRect.bottom - listRect.bottom;
  }, [open, highlighted, query]);

  function select(item: string) {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (multiple) {
      if (selected.has(normalize(trimmed))) {
        onChange(value.filter((entry) => normalize(entry) !== normalize(trimmed)));
      } else if (!limitReached) {
        onChange([...value, trimmed]);
      } else return;
      setQuery("");
      setActiveIndex(0);
    } else {
      onChange([trimmed]);
      closeMenu();
    }
    if (multiple && searchInside && !browsing) searchRef.current?.focus({ preventScroll: true });
    else restoreControlFocus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu(browsing);
        setActiveIndex(event.key === "ArrowUp" ? Math.max(0, pool.length - 1) : 0);
      } else if (choices.length) {
        setActiveIndex((highlighted + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (!open) openMenu(browsing);
      else if (choices[highlighted]) select(choices[highlighted]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      restoreControlFocus();
    } else if (open && (event.key === "Home" || event.key === "End") && searchInside) {
      // Leave text editing keys available in searchable text fields.
      if (event.currentTarget instanceof HTMLButtonElement) {
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : Math.max(0, choices.length - 1));
      }
    }
  }

  function changeQuery(next: string) {
    if (!open || browsing) openMenu();
    setQuery(next);
    setActiveIndex(0);
  }

  function handleSearchTouch(event: ReactPointerEvent<HTMLInputElement>) {
    if (event.pointerType === "mouse" || !event.isPrimary || event.button !== 0
      || document.activeElement === event.currentTarget) return;
    // Native touch focus can reveal/zoom the input before the menu is positioned.
    // Focus in the same user gesture with preventScroll to skip that reveal.
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
  }

  function handleArrowClick() {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (mobile) {
      // Browsing never focuses a text field, including after selecting a result.
      const focused = document.activeElement;
      if (focused instanceof HTMLInputElement
        && (wrapperRef.current?.contains(focused) || popupRef.current?.contains(focused))) focused.blur();
      arrowRef.current?.focus({ preventScroll: true });
      if (open && browsing) closeMenu();
      else openMenu(true);
    } else if (open) closeMenu();
    else {
      controlRef.current?.focus({ preventScroll: true });
      openMenu();
    }
  }

  const comboAttributes = {
    "aria-labelledby": labelledBy,
    "aria-activedescendant": open && choices.length ? `${id}-option-${highlighted}` : undefined,
    "aria-describedby": maxSelections ? helpId : undefined,
    "aria-haspopup": "listbox" as const,
  };

  const portalRoot = present ? document.getElementById(portalRootId) : null;

  return (
    <div ref={wrapperRef} className={styles.selectWrapper} onBlur={(event) => {
      if (event.relatedTarget instanceof Node && !wrapperRef.current?.contains(event.relatedTarget)
        && !popupRef.current?.contains(event.relatedTarget)) closeMenu();
    }}>
      <div ref={fieldRef} className={`${styles.inputField}${open ? ` ${styles.inputOpen}` : ""}`}>
        {searchInside ? (
          <button ref={(node) => { controlRef.current = node; }} type="button" role="combobox"
            aria-controls={open ? listId : undefined} aria-expanded={open}
            className={styles.selectTrigger} {...comboAttributes}
            onClick={() => open && !browsing ? closeMenu() : openMenu()} onKeyDown={handleKeyDown}>
            <span className={styles.placeholder}>{value.length ? `${value.length} ${value.length === 1 ? "industry" : "industries"} selected` : placeholder}</span>
          </button>
        ) : (
          <>
            <input ref={(node) => { controlRef.current = node; }} role="combobox"
              aria-controls={open ? listId : undefined} aria-expanded={open}
              {...comboAttributes} aria-autocomplete="list" autoComplete="off"
              placeholder={placeholder} value={open && !browsing ? query : multiple ? "" : value[0] ?? ""}
              onPointerDown={handleSearchTouch}
              onFocus={() => { if (!open || browsing) openMenu(); }} onClick={() => { if (!open || browsing) openMenu(); }}
              onChange={(event) => changeQuery(event.target.value)} onKeyDown={handleKeyDown} />
            {!multiple && value.length > 0 && (
              <button type="button" className={styles.fieldIconButton} aria-label={`Clear ${label.toLowerCase()}`}
                onClick={() => { onChange([]); setQuery(""); setActiveIndex(0); restoreControlFocus(); }}>
                <FilterIcon name="close" size={15} />
              </button>
            )}
          </>
        )}
        <button ref={arrowRef} type="button" className={styles.fieldIconButton} tabIndex={-1}
          role={browsing ? "combobox" : undefined}
          aria-expanded={open} aria-controls={open ? listId : undefined} aria-haspopup="listbox"
          aria-activedescendant={browsing && open && choices.length ? `${id}-option-${highlighted}` : undefined}
          aria-label={`${open && browsing ? "Close" : "Open"} ${label.toLowerCase()} options`}
          onClick={handleArrowClick} onKeyDown={browsing ? handleKeyDown : undefined}>
          <FilterIcon name={chevron} size={16} />
        </button>
      </div>

      {multiple && value.length > 0 && (
        <ul className={styles.chips} aria-label={`Selected ${label.toLowerCase()}`}>
          {value.map((item) => (
            <li key={normalize(item)} className={styles.chip}>
              <span>{item}</span>
              <button type="button" aria-label={`Remove ${item}`} onClick={() => {
                onChange(value.filter((entry) => normalize(entry) !== normalize(item)));
                restoreControlFocus();
              }}><FilterIcon name="close" size={12} /></button>
            </li>
          ))}
        </ul>
      )}
      {maxSelections !== undefined && (
        <p id={helpId} className={styles.selectionHelp} role="status" aria-live="polite">
          {value.length}/{maxSelections} {label.toLowerCase()} selected{limitReached ? ". Remove one to add another." : ""}
        </p>
      )}

      {portalRoot && createPortal(
        <div ref={popupRef} className={styles.popover} data-open={open ? "true" : "false"}
          aria-hidden={!open} inert={!open} style={position ?? { visibility: "hidden" }}>
          {searchInside && !browsing && (
            <div className={styles.popupSearch}>
              <FilterIcon name="search" size={16} />
              <input ref={searchRef} type="text" role="combobox" {...comboAttributes}
                aria-controls={open ? listId : undefined} aria-expanded={open}
                aria-label={`Search ${label.toLowerCase()}`} aria-labelledby={undefined}
                aria-autocomplete="list" autoComplete="off" placeholder={`Search ${label.toLowerCase()}…`}
                onPointerDown={handleSearchTouch}
                value={query} onChange={(event) => changeQuery(event.target.value)} onKeyDown={handleKeyDown} />
            </div>
          )}
          <div ref={listRef} id={listId} className={styles.optionList} role="listbox"
            aria-label={`${label} suggestions`} aria-multiselectable={multiple || undefined}>
            {choices.map((item, index) => {
              const isSelected = selected.has(normalize(item));
              const disabled = limitReached && !isSelected;
              return (
                <button key={normalize(item)} id={`${id}-option-${index}`} type="button" role="option"
                  aria-selected={isSelected} aria-disabled={disabled} tabIndex={-1}
                  className={styles.dropdownOption} data-highlighted={index === highlighted ? "true" : undefined}
                  onPointerMove={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(item)}>
                  <span>{custom && normalize(item) === normalize(query) ? `+ Add "${item}"` : item}</span>
                  {isSelected && <FilterIcon name="check" size={16} />}
                </button>
              );
            })}
          </div>
          {!choices.length && <p className={styles.noResults} role="status">No {label.toLowerCase()} found.</p>}
          {limitReached && <p className={styles.limitNote}>You can select up to {maxSelections} {label.toLowerCase()}. Remove one to add another.</p>}
        </div>, portalRoot,
      )}
    </div>
  );
}
