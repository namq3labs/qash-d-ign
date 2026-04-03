"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Bank } from "@/data/fiat-payout";

interface BankDropdownProps {
  banks: Bank[];
  selectedBank?: string;
  onBankSelect: (bankName: string) => void;
  disabled?: boolean;
  variant?: "outlined" | "filled";
  size?: "default" | "compact";
}

export const BankDropdown = ({
  banks,
  selectedBank,
  onBankSelect,
  disabled = false,
  variant = "filled",
  size = "default",
}: BankDropdownProps) => {
  const containerStyle = useMemo(() => {
    const baseStyle =
      variant === "outlined"
        ? "border border-primary-divider rounded-xl bg-transparent"
        : "bg-app-background border-b-2 border-primary-divider rounded-xl";
    const heightStyle = size === "compact" ? "h-[52px]" : "h-[64px]";
    return `${baseStyle} ${heightStyle}`;
  }, [variant, size]);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBanks = useMemo(
    () => banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [banks, search],
  );

  const handleSelect = (bankName: string) => {
    onBankSelect(bankName);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed justify-between ${containerStyle}`}
        disabled={disabled}
      >
        <div className="flex flex-col justify-center">
          <span className={`text-text-secondary ${size === "compact" ? "text-[12px]" : "text-[14px]"}`}>
            Select bank
          </span>
          {selectedBank && (
            <p className={`text-text-primary font-semibold ${size === "compact" ? "text-[14px]" : "text-[16px]"}`}>
              {selectedBank}
            </p>
          )}
        </div>
        <img
          src="/arrow/chevron-down.svg"
          alt="dropdown"
          className={`w-6 h-6 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mb-5 shadow-lg bg-background border-2 border-primary-divider rounded-xl z-50 overflow-hidden p-2">
          <div className="px-2 py-1">
            <input
              type="text"
              placeholder="Search bank..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-app-background border border-primary-divider rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none"
              autoFocus
            />
          </div>
          <div className="flex flex-col max-h-[200px] overflow-y-auto mt-1">
            {filteredBanks.length === 0 && (
              <p className="text-text-secondary text-sm px-2 py-2">No banks found</p>
            )}
            {filteredBanks.map(bank => (
              <button
                key={bank.code}
                type="button"
                onClick={() => handleSelect(bank.name)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-app-background transition-colors cursor-pointer ${
                  selectedBank === bank.name ? "bg-app-background" : ""
                }`}
              >
                <span className="text-text-primary font-semibold">{bank.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
