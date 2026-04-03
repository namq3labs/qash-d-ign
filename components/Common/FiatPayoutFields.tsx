"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { FIAT_COUNTRIES, FiatCountry, getRailLabel } from "@/data/fiat-payout";
import { BankDropdown } from "./Dropdown/BankDropdown";

interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const FiatInput = ({ label, placeholder, value, onChange, disabled, required }: FormInputProps) => (
  <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
    <div className="flex flex-col gap-1 px-4 py-2">
      <label className="text-text-secondary text-sm font-medium">
        {label} {!required && <span className="text-text-secondary">(Optional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  </div>
);

export interface FiatPayoutData {
  country: string;
  countryCode: string;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  routingOrSwift: string;
}

interface FiatPayoutFieldsProps {
  data: FiatPayoutData;
  onChange: (data: FiatPayoutData) => void;
  disabled?: boolean;
}

export const FiatPayoutFields = ({ data, onChange, disabled = false }: FiatPayoutFieldsProps) => {
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCountry = useMemo(
    () => FIAT_COUNTRIES.find(c => c.code === data.countryCode),
    [data.countryCode],
  );

  const railLabels = useMemo(
    () => getRailLabel(selectedCountry?.rail ?? "swift"),
    [selectedCountry],
  );

  const handleCountrySelect = (country: FiatCountry) => {
    onChange({
      ...data,
      country: country.name,
      countryCode: country.code,
      currency: country.currencyCode,
      bankName: "",
      routingOrSwift: "",
    });
    setCountryOpen(false);
  };

  const update = (field: keyof FiatPayoutData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Country Selection */}
      <div className="relative" ref={countryRef}>
        <button
          type="button"
          onClick={() => !disabled && setCountryOpen(!countryOpen)}
          className="flex items-center gap-2 px-4 py-2 w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed justify-between bg-app-background border-b-2 border-primary-divider rounded-xl h-[64px]"
          disabled={disabled}
        >
          <div className="flex flex-row items-center gap-2">
            {selectedCountry && (
              <img src={selectedCountry.icon} alt={selectedCountry.name} className="w-6 h-6 flex-shrink-0" />
            )}
            <div className="flex flex-col justify-center">
              <span className="text-text-secondary text-[14px]">Recipient country</span>
              {selectedCountry && (
                <p className="text-text-primary font-semibold text-[16px]">{selectedCountry.name}</p>
              )}
            </div>
          </div>
          <img
            src="/arrow/chevron-down.svg"
            alt="dropdown"
            className={`w-6 h-6 transition-transform flex-shrink-0 ${countryOpen ? "rotate-180" : ""}`}
          />
        </button>

        {countryOpen && (
          <div className="absolute top-full left-0 right-0 mb-5 shadow-lg bg-background border-2 border-primary-divider rounded-xl z-50 overflow-hidden p-2 max-h-[280px] overflow-y-auto">
            <div className="px-2 py-1">
              <p className="text-text-secondary text-xs">Select recipient country</p>
            </div>
            <div className="flex flex-col">
              {FIAT_COUNTRIES.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-app-background transition-colors cursor-pointer ${
                    data.countryCode === country.code ? "bg-app-background" : ""
                  }`}
                >
                  <img src={country.icon} alt={country.name} className="w-5 h-5" />
                  <span className="text-text-primary font-semibold">{country.name}</span>
                  <span className="text-text-secondary text-sm ml-auto">{country.currencyCode}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conditional fields based on selected country */}
      {selectedCountry && (
        <>
          {/* Bank dropdown for countries with local rails */}
          {selectedCountry.rail === "local" && selectedCountry.banks.length > 0 && (
            <BankDropdown
              banks={selectedCountry.banks}
              selectedBank={data.bankName}
              onBankSelect={name => update("bankName", name)}
              disabled={disabled}
              variant="filled"
            />
          )}

          {/* Rail-specific fields */}
          {selectedCountry.rail === "ach" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <FiatInput
                  label={railLabels.primary}
                  placeholder={railLabels.placeholder1}
                  value={data.routingOrSwift}
                  onChange={v => update("routingOrSwift", v)}
                  disabled={disabled}
                  required
                />
              </div>
              <div className="flex-1">
                <FiatInput
                  label={railLabels.secondary}
                  placeholder={railLabels.placeholder2}
                  value={data.accountNumber}
                  onChange={v => update("accountNumber", v)}
                  disabled={disabled}
                  required
                />
              </div>
            </div>
          )}

          {selectedCountry.rail === "fps" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <FiatInput
                  label={railLabels.primary}
                  placeholder={railLabels.placeholder1}
                  value={data.routingOrSwift}
                  onChange={v => update("routingOrSwift", v)}
                  disabled={disabled}
                  required
                />
              </div>
              <div className="flex-1">
                <FiatInput
                  label={railLabels.secondary}
                  placeholder={railLabels.placeholder2}
                  value={data.accountNumber}
                  onChange={v => update("accountNumber", v)}
                  disabled={disabled}
                  required
                />
              </div>
            </div>
          )}

          {selectedCountry.rail === "sepa" && (
            <div className="flex flex-col gap-3">
              <FiatInput
                label={railLabels.primary}
                placeholder={railLabels.placeholder1}
                value={data.accountNumber}
                onChange={v => update("accountNumber", v)}
                disabled={disabled}
                required
              />
              <FiatInput
                label={railLabels.secondary}
                placeholder={railLabels.placeholder2}
                value={data.routingOrSwift}
                onChange={v => update("routingOrSwift", v)}
                disabled={disabled}
              />
            </div>
          )}

          {selectedCountry.rail === "local" && (
            <FiatInput
              label="Account number"
              placeholder="e.g. 1234567890"
              value={data.accountNumber}
              onChange={v => update("accountNumber", v)}
              disabled={disabled}
              required
            />
          )}

          {/* Account holder - always shown */}
          <FiatInput
            label="Account holder name"
            placeholder="Name on the account"
            value={data.accountHolder}
            onChange={v => update("accountHolder", v)}
            disabled={disabled}
            required
          />

          {/* Currency - auto-filled, read-only */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-app-background border border-primary-divider">
            <div className="flex-1">
              <p className="text-text-secondary text-xs">Currency</p>
              <p className="text-text-primary text-sm font-medium">
                {selectedCountry.currencyCode} ({selectedCountry.currency})
              </p>
            </div>
            <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded-full border border-primary-divider">
              Auto-selected
            </span>
          </div>

          {/* Source token info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-app-background border border-primary-divider">
            <img src="/token/usdt.svg" alt="USDT" className="w-7 h-7" />
            <div className="flex-1">
              <p className="text-text-secondary text-xs">Paid from</p>
              <p className="text-text-primary text-sm font-medium">USDT (Stablecoin)</p>
            </div>
            <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded-full border border-primary-divider">
              Auto-converted
            </span>
          </div>
        </>
      )}
    </div>
  );
};
