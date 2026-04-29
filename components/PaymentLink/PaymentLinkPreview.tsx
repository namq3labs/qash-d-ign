import React, { useState } from "react";
import CompanyAvatar from "../Common/CompanyAvatar";
import { BaseContainer } from "../Common/BaseContainer";
import { formatAddress } from "@/services/utils/miden/address";
import { PrimaryButton } from "../Common/PrimaryButton";
import { toast } from "react-hot-toast";
import { AssetWithMetadata } from "@/types/faucet";
import { useMidenProvider } from "@/contexts/MidenProvider";
// Stubbed: @miden-sdk/miden-wallet-adapter removed
const useWallet = () => ({ address: null, connected: false, disconnect: async () => {}, requestSend: null, wallet: null });

type PaymentMethod = "crypto" | "card";

const CHAINS = [
  { id: "ethereum", name: "Ethereum", icon: "/chain/ethereum.svg" },
  { id: "base", name: "Base", icon: "/chain/base.svg" },
  { id: "solana", name: "Solana", icon: "/chain/solana.svg" },
  { id: "bnb", name: "BNB Chain", icon: "/chain/bnb.svg" },
  { id: "miden", name: "Miden", icon: "/chain/miden.svg" },
];

const TOKENS: Record<string, { id: string; symbol: string; icon: string }[]> = {
  ethereum: [
    { id: "eth", symbol: "ETH", icon: "/token/eth.svg" },
    { id: "usdc", symbol: "USDC", icon: "/token/usdc.svg" },
    { id: "usdt", symbol: "USDT", icon: "/token/usdt.svg" },
  ],
  base: [
    { id: "eth", symbol: "ETH", icon: "/token/eth.svg" },
    { id: "usdc", symbol: "USDC", icon: "/token/usdc.svg" },
  ],
  solana: [
    { id: "usdc", symbol: "USDC", icon: "/token/usdc.svg" },
    { id: "usdt", symbol: "USDT", icon: "/token/usdt.svg" },
  ],
  bnb: [
    { id: "usdt", symbol: "USDT", icon: "/token/usdt.svg" },
    { id: "bnb", symbol: "BNB", icon: "/token/eth.svg" },
  ],
  miden: [
    { id: "usdt", symbol: "USDT", icon: "/token/usdt.svg" },
  ],
};

interface PaymentLinkPreviewProps {
  recipient: string;
  recipientAvatar?: string | null;
  paymentWalletAddress: string;
  amount: string;
  title: string;
  description: string;
  selectedToken: AssetWithMetadata | null;
  handleSubmitPayment?: () => void;
  handleConnectWallet?: () => void;
  isSending?: boolean;
}

export const PaymentLinkPreview = ({
  recipient,
  recipientAvatar,
  paymentWalletAddress,
  amount,
  title,
  description,
  selectedToken,
  handleSubmitPayment,
  handleConnectWallet,
  isSending,
}: PaymentLinkPreviewProps) => {
  const { address: paraAddress } = useMidenProvider();
  const { address: adapterAddress } = useWallet();
  const walletAddress = paraAddress || adapterAddress;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [payChain, setPayChain] = useState(CHAINS[0]);
  const [payToken, setPayToken] = useState(TOKENS["ethereum"][0]);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  const receiveTokenSymbol = selectedToken?.metadata?.symbol || "USDT";
  const receiveTokenIcon = `/token/${receiveTokenSymbol.toLowerCase()}.svg`;
  const displayAmount = amount ? parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

  const handleChainSelect = (chain: typeof CHAINS[0]) => {
    setPayChain(chain);
    const tokens = TOKENS[chain.id] || TOKENS["ethereum"];
    setPayToken(tokens[0]);
    setShowChainDropdown(false);
  };

  const handleTokenSelect = (token: typeof TOKENS["ethereum"][0]) => {
    setPayToken(token);
    setShowTokenDropdown(false);
  };

  const availableTokens = TOKENS[payChain.id] || TOKENS["ethereum"];

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleCardPay = async () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      toast.error("Please fill in all card details");
      return;
    }
    setIsProcessingCard(true);
    // Simulate card processing (demo only)
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success("Card payment processed! Stablecoin will be delivered to the recipient.");
    setIsProcessingCard(false);
  };

  const getCardBrand = (number: string): string => {
    const digits = number.replace(/\D/g, "");
    if (digits.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
    if (/^3[47]/.test(digits)) return "Amex";
    return "";
  };

  return (
    <BaseContainer
      header={
        <header className="flex items-center w-full justify-between px-5 py-2">
          <div className="flex flex-1 gap-2 items-center">
            <CompanyAvatar logo={recipientAvatar} companyName={recipient} size="w-[24px]" className="text-xs" />
            <div className="flex flex-col">
              <span className="text-sm truncate text-text-primary leading-none">{recipient}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm truncate text-text-secondary leading-none">
                  {formatAddress(paymentWalletAddress || "0x")}
                </span>
                <img
                  src="/misc/copy-icon.svg"
                  className="w-4 cursor-pointer"
                  alt="copy icon"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentWalletAddress || "");
                    toast.success("Copied to clipboard");
                  }}
                />
              </div>
            </div>
          </div>
        </header>
      }
      containerClassName="w-full h-full border-1 border-[#D4D6D9]"
    >
      <div className="w-full h-full flex flex-row gap-2 p-3">
        {/* Pay with */}
        <div className="flex flex-col gap-3 bg-background rounded-xl p-3 w-[50%]">
          <span className="text-text-primary text-lg font-semibold">Pay with</span>

          {/* Payment method dropdown */}
          <div className="relative">
            <div
              className="bg-app-background rounded-xl border-b-2 border-primary-divider cursor-pointer"
              onClick={() => { setShowMethodDropdown(!showMethodDropdown); setShowChainDropdown(false); setShowTokenDropdown(false); }}
            >
              <div className="flex items-center gap-2 px-4 py-2 h-full w-full">
                {paymentMethod === "crypto" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M13 11.15H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 11.15V7.53C2 5.49 3.65 3.84 5.69 3.84H11.31C13.35 3.84 15 5.17 15 7.21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.48 12.2C16.98 12.68 16.74 13.42 16.94 14.18C17.19 15.11 18.11 15.7 19.07 15.7H20V17.15C20 19.36 18.21 21.15 16 21.15H6C3.79 21.15 2 19.36 2 17.15V10.15C2 7.94 3.79 6.15 6 6.15H16C17.83 6.15 20 7.95 20 10.15V11.6H18.92C18.36 11.6 17.85 11.82 17.48 12.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 12.62V14.88C22 15.44 21.54 15.9 20.97 15.9H19.04C17.96 15.9 16.97 15.12 16.88 14.04C16.82 13.41 17.06 12.82 17.48 12.4C17.85 12.02 18.36 11.8 18.92 11.8H20.97C21.54 11.8 22 12.26 22 12.62Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                <div className="flex-1">
                  <p className="text-text-secondary text-sm leading-none">Payment method</p>
                  <p className="text-text-primary text-base font-medium">
                    {paymentMethod === "crypto" ? "Cryptocurrency" : "Credit / Debit Card"}
                  </p>
                </div>
                <img src="/arrow/chevron-down.svg" alt="dropdown" className={`w-6 h-6 transition-transform ${showMethodDropdown ? "rotate-180" : ""}`} />
              </div>
            </div>

            {showMethodDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-primary-divider rounded-xl shadow-lg z-20 overflow-hidden">
                <div
                  className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${paymentMethod === "crypto" ? "bg-app-background" : "hover:bg-app-background"}`}
                  onClick={() => { setPaymentMethod("crypto"); setShowMethodDropdown(false); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 11.15H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 11.15V7.53C2 5.49 3.65 3.84 5.69 3.84H11.31C13.35 3.84 15 5.17 15 7.21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.48 12.2C16.98 12.68 16.74 13.42 16.94 14.18C17.19 15.11 18.11 15.7 19.07 15.7H20V17.15C20 19.36 18.21 21.15 16 21.15H6C3.79 21.15 2 19.36 2 17.15V10.15C2 7.94 3.79 6.15 6 6.15H16C17.83 6.15 20 7.95 20 10.15V11.6H18.92C18.36 11.6 17.85 11.82 17.48 12.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 12.62V14.88C22 15.44 21.54 15.9 20.97 15.9H19.04C17.96 15.9 16.97 15.12 16.88 14.04C16.82 13.41 17.06 12.82 17.48 12.4C17.85 12.02 18.36 11.8 18.92 11.8H20.97C21.54 11.8 22 12.26 22 12.62Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-text-primary text-sm flex-1">Cryptocurrency</span>
                  {paymentMethod === "crypto" && <img src="/misc/blue-check-icon.svg" alt="" className="w-4 h-4" />}
                </div>
                <div
                  className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${paymentMethod === "card" ? "bg-app-background" : "hover:bg-app-background"}`}
                  onClick={() => { setPaymentMethod("card"); setShowMethodDropdown(false); }}
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-text-primary text-sm flex-1">Credit / Debit Card</span>
                  {paymentMethod === "card" && <img src="/misc/blue-check-icon.svg" alt="" className="w-4 h-4" />}
                </div>
              </div>
            )}
          </div>

          {paymentMethod === "crypto" ? (
            <>
              {/* Network selector */}
              <div className="relative">
                <div
                  className="bg-app-background rounded-xl border-b-2 border-primary-divider cursor-pointer"
                  onClick={() => { setShowChainDropdown(!showChainDropdown); setShowTokenDropdown(false); }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 h-full w-full">
                    <img src={payChain.icon} alt={payChain.name} className="w-8 h-8" />
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm leading-none">Network</p>
                      <p className="text-text-primary text-base font-medium">{payChain.name}</p>
                    </div>
                    <img src="/arrow/chevron-down.svg" alt="dropdown" className={`w-6 h-6 transition-transform ${showChainDropdown ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {showChainDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-primary-divider rounded-xl shadow-lg z-20 overflow-hidden">
                    {CHAINS.map(chain => (
                      <div
                        key={chain.id}
                        className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${chain.id === payChain.id ? "bg-app-background" : "hover:bg-app-background"}`}
                        onClick={() => handleChainSelect(chain)}
                      >
                        <img src={chain.icon} alt={chain.name} className="w-6 h-6" />
                        <span className="text-text-primary text-sm flex-1">{chain.name}</span>
                        {chain.id === payChain.id && <img src="/misc/blue-check-icon.svg" alt="" className="w-4 h-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Token selector */}
              <div className="relative">
                <div
                  className="bg-app-background rounded-xl border-b-2 border-primary-divider cursor-pointer"
                  onClick={() => { setShowTokenDropdown(!showTokenDropdown); setShowChainDropdown(false); }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 h-full w-full">
                    <img src={payToken.icon} alt={payToken.symbol} className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm leading-none">Token</p>
                      <p className="text-text-primary text-base font-medium">{payToken.symbol}</p>
                    </div>
                    <img src="/arrow/chevron-down.svg" alt="dropdown" className={`w-6 h-6 transition-transform ${showTokenDropdown ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {showTokenDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-primary-divider rounded-xl shadow-lg z-20 overflow-hidden">
                    {availableTokens.map(token => (
                      <div
                        key={token.id}
                        className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${token.id === payToken.id ? "bg-app-background" : "hover:bg-app-background"}`}
                        onClick={() => handleTokenSelect(token)}
                      >
                        <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-text-primary text-sm flex-1">{token.symbol}</span>
                        {token.id === payToken.id && <img src="/misc/blue-check-icon.svg" alt="" className="w-4 h-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
                <div className="flex flex-col gap-1 px-4 py-2">
                  <label className="text-text-secondary text-sm font-medium">Amount</label>
                  <div className="flex items-center">
                    <input
                      placeholder="Enter amount"
                      value={amount || ""}
                      className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                      autoComplete="off"
                      disabled={!!amount}
                    />
                    <span className="text-text-secondary text-sm">{payToken.symbol}</span>
                  </div>
                </div>
              </div>
              {amount && (
                <span className="text-text-secondary text-xs px-1">{"\u2248"} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              )}

              {/* Connect Wallet / Pay Button */}
              <div className="flex justify-center mt-1">
                {walletAddress && handleSubmitPayment ? (
                  <PrimaryButton text="Pay now" onClick={handleSubmitPayment} loading={isSending} />
                ) : (
                  <PrimaryButton text="Connect Wallet" onClick={() => handleConnectWallet?.()} />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Card number */}
              <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
                <div className="flex flex-col gap-1 px-4 py-2">
                  <label className="text-text-secondary text-sm font-medium">Card number</label>
                  <div className="flex items-center">
                    <input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                      autoComplete="cc-number"
                      inputMode="numeric"
                    />
                    {getCardBrand(cardNumber) && (
                      <span className="text-text-secondary text-xs font-medium whitespace-nowrap">{getCardBrand(cardNumber)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expiry + CVC row */}
              <div className="flex gap-2">
                <div className="bg-app-background rounded-xl border-b-2 border-primary-divider flex-1">
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <label className="text-text-secondary text-sm font-medium">Expiry</label>
                    <input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                      className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="bg-app-background rounded-xl border-b-2 border-primary-divider flex-1">
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <label className="text-text-secondary text-sm font-medium">CVC</label>
                    <input
                      placeholder="123"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* Cardholder name */}
              <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
                <div className="flex flex-col gap-1 px-4 py-2">
                  <label className="text-text-secondary text-sm font-medium">Cardholder name</label>
                  <input
                    placeholder="John Doe"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                    autoComplete="cc-name"
                  />
                </div>
              </div>

              {/* Amount display */}
              <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
                <div className="flex flex-col gap-1 px-4 py-2">
                  <label className="text-text-secondary text-sm font-medium">Amount</label>
                  <div className="flex items-center">
                    <span className="text-text-primary flex-1">
                      {displayAmount ? `$${displayAmount}` : "$0.00"} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Powered by notice */}
              <div className="flex items-center justify-center gap-1.5 py-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 1C3.24 1 1 3.24 1 6C1 8.76 3.24 11 6 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 6 1ZM6 10C3.79 10 2 8.21 2 6C2 3.79 3.79 2 6 2C8.21 2 10 3.79 10 6C10 8.21 8.21 10 6 10Z" fill="currentColor" opacity="0.3"/>
                  <path d="M5.5 4.5H6.5V8.5H5.5V4.5ZM5.5 3H6.5V4H5.5V3Z" fill="currentColor" opacity="0.3"/>
                </svg>
                <span className="text-text-secondary text-xs">Card payments are converted to stablecoin and delivered on-chain</span>
              </div>

              {/* Pay button */}
              <div className="flex justify-center mt-1">
                <PrimaryButton
                  text={displayAmount ? `Pay $${displayAmount}` : "Pay now"}
                  onClick={handleCardPay}
                  loading={isProcessingCard}
                  disabled={!cardNumber || !cardExpiry || !cardCvc || !cardName}
                />
              </div>
            </>
          )}
        </div>

        {/* Transfer Details */}
        <div className="flex flex-col justify-between items-center w-[50%]">
          <div className="flex flex-col gap-2 w-full">
            <span className="text-text-primary text-2xl font-semibold">{recipient} receives</span>

            {/* Locked network */}
            <div
              className="w-full bg-background rounded-[12px] flex flex-row gap-1 border border-primary-divider p-3 py-4 items-center"
            >
              <img src="/chain/miden.svg" alt="Miden" className="w-8 h-8" />
              <div className="flex flex-col flex-1">
                <span className="text-text-secondary text-xs leading-none">Network</span>
                <span className="text-text-primary text-sm font-medium leading-none mt-0.5">Miden</span>
              </div>
              <img src="/misc/lock-icon.svg" alt="locked" className="w-4 h-4 opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>

            {/* Locked token */}
            <div
              className="w-full bg-background rounded-[12px] flex flex-row gap-1 border border-primary-divider p-3 py-4 items-center"
            >
              <img src={receiveTokenIcon} onError={(e) => { (e.target as HTMLImageElement).src = "/token/usdt.svg"; }} alt={receiveTokenSymbol} className="w-8 h-8" />
              <div className="flex flex-col flex-1">
                <span className="text-text-secondary text-xs leading-none">Token</span>
                <span className="text-text-primary text-sm font-medium leading-none mt-0.5">{receiveTokenSymbol}</span>
              </div>
              <img src="/misc/lock-icon.svg" alt="locked" className="w-4 h-4 opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>

            {/* Transfer detail card */}
            <div
              className="w-full bg-background rounded-[12px] flex flex-row gap-1 border border-primary-divider p-3 py-5 justify-between items-center"
              style={{
                backgroundImage: "url(/card/background.svg)",
                backgroundSize: "20%",
                backgroundPosition: "right",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-full">
                <span className="text-text-secondary text-base font-bold leading-none truncate">
                  {title || "Enter title"}
                </span>
                <span className="text-text-secondary text-sm leading-none truncate">
                  {description || "Description"}
                </span>
              </div>

              <div className="flex flex-row gap-1 items-center">
                <img
                  src={receiveTokenIcon}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/token/usdt.svg"; }}
                  className="w-5 h-5"
                />
                <span className="text-text-primary font-semibold leading-none">
                  {amount || "0"} {receiveTokenSymbol}
                </span>
              </div>
            </div>

            {/* Total payable */}
            <div
              className="w-full bg-background rounded-[12px] flex flex-row gap-1 border border-primary-divider p-3 py-5 justify-between items-center"
              style={{
                backgroundImage: "url(/card/background.svg)",
                backgroundSize: "20%",
                backgroundPosition: "right",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-sm leading-none">Total payable amount</span>
                <div className="flex flex-row gap-1 items-center">
                  <img
                    src={receiveTokenIcon}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/token/usdt.svg"; }}
                    className="w-5 h-5"
                  />
                  <span className="text-text-primary text-2xl leading-none">
                    {(parseFloat(amount || "0") + 0).toFixed(2)} {receiveTokenSymbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};
