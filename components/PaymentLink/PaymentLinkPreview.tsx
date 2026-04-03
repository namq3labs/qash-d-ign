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

  const [payChain, setPayChain] = useState(CHAINS[0]);
  const [payToken, setPayToken] = useState(TOKENS["ethereum"][0]);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

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
                <span className="text-text-primary text-sm font-medium leading-none mt-0.5">Miden Testnet</span>
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
