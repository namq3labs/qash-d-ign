"use client";
import { useTitle } from "@/contexts/TitleProvider";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryButton } from "../Common/PrimaryButton";
import { useModal } from "@/contexts/ModalManagerProvider";
import { ChooseAccountModalProps } from "@/types/modal";
import toast from "react-hot-toast";

interface Reimbursement {
  id: string;
  employeeName: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  status: "pending" | "approved" | "paid" | "rejected";
}

const MOCK_REIMBURSEMENTS: Reimbursement[] = [
  { id: "r-001", employeeName: "Sarah Kim", description: "Client dinner at Marina Bay", amount: 245.80, currency: "USDT", category: "Meals", date: "2026-03-28", status: "pending" },
  { id: "r-002", employeeName: "Alex Chen", description: "AWS Summit conference ticket", amount: 599.00, currency: "USDT", category: "Conference", date: "2026-03-25", status: "pending" },
  { id: "r-003", employeeName: "Marcus Rivera", description: "Uber rides (March)", amount: 87.50, currency: "USDT", category: "Transport", date: "2026-03-22", status: "pending" },
  { id: "r-004", employeeName: "James Liu", description: "GitHub Enterprise renewal", amount: 1200.00, currency: "USDT", category: "Software", date: "2026-03-20", status: "approved" },
];

const ReimbursementItem = ({
  employeeName,
  description,
  amount,
  currency,
  category,
  date,
}: {
  employeeName: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
}) => {
  const initials = employeeName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="grid grid-cols-[1fr_1fr_120px_120px_140px] gap-4 items-center w-full border-b border-primary-divider px-4 py-3 bg-background rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#7D52F4]/10 flex items-center justify-center text-[#7D52F4] text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-text-primary">{employeeName}</span>
      </div>
      <span className="text-sm text-text-secondary">{description}</span>
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-app-background border border-primary-divider text-text-primary text-center">
        {category}
      </span>
      <span className="text-sm text-text-secondary text-center">
        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
      <div className="flex items-center justify-end gap-1.5">
        <img src={`/token/${currency.toLowerCase()}.svg`} alt={currency} className="w-5 h-5" />
        <span className="font-medium text-text-primary">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
      </div>
    </div>
  );
};

const ReimbursementReviewContainer = () => {
  const router = useRouter();
  const { setTitle, setShowBackArrow, setOnBackClick } = useTitle();
  const { openModal } = useModal();

  const pending = MOCK_REIMBURSEMENTS.filter((r) => r.status === "pending" || r.status === "approved");
  const total = pending.reduce((sum, r) => sum + r.amount, 0);

  const { register, watch } = useForm({
    defaultValues: {
      proposalDescription: "",
    },
  });

  const proposalDescription = watch("proposalDescription");

  useEffect(() => {
    const handleBack = () => {
      router.back();
    };

    setTitle(
      <div className="flex items-center gap-2">
        <span className="text-text-secondary">Reimbursement /</span>
        <span className="text-text-primary">Review & Pay</span>
      </div>,
    );
    setShowBackArrow(true);
    setOnBackClick(() => handleBack);

    return () => {
      setOnBackClick(undefined);
      setShowBackArrow(false);
    };
  }, [router]);

  const handlePropose = () => {
    openModal<ChooseAccountModalProps>("CHOOSE_ACCOUNT", {
      onConfirm: (selectedAccount) => {
        toast.success(`Proposal created for ${pending.length} reimbursement(s) from ${selectedAccount.name}. Waiting for signatures.`);
        router.push("/reimbursement");
      },
    });
  };

  return (
    <div className="flex flex-col w-full h-full justify-start items-start p-7 gap-5">
      <div className="flex flex-row gap-3">
        <img src="/sidebar/bill.svg" alt="Reimbursement" className="w-6" />
        <span className="font-bold text-2xl">Review reimbursements</span>
      </div>

      <div className="flex flex-row w-full h-full">
        {/* Left Side - Reimbursement List */}
        <div className="flex-1 border-r-0 border border-primary-divider rounded-l-2xl p-5 bg-app-background flex flex-col gap-3 h-full overflow-auto">
          <div className="flex flex-row justify-between w-full items-center">
            <span className="font-semibold text-lg">Pending reimbursements</span>
            <span className="text-lg text-text-secondary">
              Count
              <span className="text-primary-blue"> {pending.length}</span>
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_120px_120px_140px] gap-4 items-center w-full px-4 py-2">
            <span className="text-xs font-medium text-text-secondary">Employee</span>
            <span className="text-xs font-medium text-text-secondary">Description</span>
            <span className="text-xs font-medium text-text-secondary text-center">Category</span>
            <span className="text-xs font-medium text-text-secondary text-center">Date</span>
            <span className="text-xs font-medium text-text-secondary text-right">Amount</span>
          </div>

          {pending.map((r) => (
            <ReimbursementItem
              key={r.id}
              employeeName={r.employeeName}
              description={r.description}
              amount={r.amount}
              currency={r.currency}
              category={r.category}
              date={r.date}
            />
          ))}
        </div>

        {/* Right Side - Payment Overview */}
        <div className="w-150 border-l-0 border border-primary-divider rounded-r-2xl bg-[#E7E7E7] h-full flex flex-col gap-4">
          <div className="flex flex-col h-full justify-between px-7 py-4">
            <div className="flex flex-col gap-2 justify-between">
              <span className="font-bold text-3xl">Payment Overview</span>
              <span className="text-text-secondary">Make sure the details are correct before proceeding.</span>
              <textarea
                {...register("proposalDescription")}
                placeholder={`Reimbursement payout for ${pending.length} employee(s)`}
                aria-label="Proposal description"
                maxLength={500}
                className="w-full min-h-[96px] p-3 rounded-lg border border-primary-divider bg-white text-sm text-text-primary resize-none focus:outline-none"
              />
              {proposalDescription && proposalDescription.length > 0 && (
                <div className="text-xs text-text-secondary mt-1">{proposalDescription.length}/500</div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-lg">Total by token</span>
              <div className="flex justify-start items-center gap-2">
                <img src="/token/usdt.svg" alt="USDT" className="w-10" />
                <div className="flex items-start flex-col gap-0.5">
                  <div className="text-[18px] leading-none">
                    {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full px-7 py-4 border-t-1 border-[#DBDCDE] justify-between items-center">
            <div className="flex flex-col gap-2">
              <span className="text-text-secondary leading-none">Total amount</span>
              <span className="font-bold text-3xl leading-none">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
              </span>
            </div>
            <PrimaryButton
              text="Propose"
              containerClassName="w-40 !rounded-xl"
              buttonClassName="h-full"
              onClick={handlePropose}
              disabled={pending.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementReviewContainer;
