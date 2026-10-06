"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISO(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "Select date";
  const date = parseISO(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select date",
  className = "",
  align = "left",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : null;
  const initialView = selectedDate || new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  // Keep view aligned when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseISO(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onChange(formatISO(newDate));
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange(formatISO(today));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const todayStr = formatISO(new Date());

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded border text-[12px] transition-all duration-150 cursor-pointer select-none ${
          isOpen
            ? "border-[var(--nova-accent)] ring-1 ring-[var(--nova-accent)] bg-[var(--nova-deep)]"
            : "border-[var(--nova-border)] hover:border-[var(--nova-border-strong)] bg-[var(--nova-bg)]"
        }`}
      >
        <span className={value ? "text-[var(--nova-text-primary)] font-medium" : "text-[var(--nova-text-muted)]"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarIcon className="w-3.5 h-3.5 text-[var(--nova-accent)] shrink-0 opacity-80" />
      </button>

      {/* Modern Popover Calendar */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-64 rounded-xl border border-[var(--nova-border-strong)] bg-[var(--nova-elevated)] p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--nova-border-muted)]">
            <span className="text-[12px] font-semibold text-[var(--nova-text-primary)] tracking-tight">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-1 text-center">
            {DAYS_SHORT.map((d) => (
              <span key={d} className="text-[10px] font-medium text-[var(--nova-text-muted)] py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
              return (
                <div
                  key={`prev-${prevDay}`}
                  className="w-7 h-7 flex items-center justify-center text-[11px] text-[var(--nova-text-muted)] opacity-30 select-none"
                >
                  {prevDay}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const currentDayDateStr = formatISO(new Date(viewYear, viewMonth, day));
              const isSelected = value === currentDayDateStr;
              const isToday = currentDayDateStr === todayStr;
              const isDisabled = minDate ? currentDayDateStr < minDate : false;

              return (
                <button
                  type="button"
                  key={`cur-${day}`}
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`w-7 h-7 flex items-center justify-center text-[11px] rounded-md transition-all duration-100 cursor-pointer select-none ${
                    isSelected
                      ? "bg-[var(--nova-accent)] text-white font-semibold shadow-xs"
                      : isToday
                      ? "bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)] font-semibold hover:bg-[var(--nova-accent)] hover:text-white"
                      : "text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] hover:text-white"
                  } ${isDisabled ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-2.5 pt-2 border-t border-[var(--nova-border-muted)] flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[var(--nova-accent-text)] hover:underline font-medium cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
