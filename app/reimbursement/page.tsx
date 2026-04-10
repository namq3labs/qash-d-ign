"use client";
import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/Common/PageHeader";
import { PrimaryButton } from "@/components/Common/PrimaryButton";
import { SecondaryButton } from "@/components/Common/SecondaryButton";
import { BaseContainer } from "@/components/Common/BaseContainer";
import { Table } from "@/components/Common/Table";
import { Badge, BadgeStatus } from "@/components/Common/Badge";
import { ModalHeader } from "@/components/Common/ModalHeader";
import BaseModal from "@/components/Modal/BaseModal";
import { useModal } from "@/contexts/ModalManagerProvider";
import { MODAL_IDS } from "@/types/modal";
import toast from "react-hot-toast";

// ---- Types ----

interface Reimbursement {
  id: string;
  employeeName: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  status: "pending" | "approved" | "paid" | "rejected";
  receiptUrl: string | null;
  receiptName: string | null;
}

// ---- Mock data ----

const MOCK_REIMBURSEMENTS: Reimbursement[] = [
  { id: "r-001", employeeName: "Sarah Kim", description: "Client dinner at Marina Bay", amount: 245.80, currency: "USDT", category: "Meals", date: "2026-03-28", status: "pending", receiptUrl: null, receiptName: "dinner_receipt.jpg" },
  { id: "r-002", employeeName: "Alex Chen", description: "AWS Summit conference ticket", amount: 599.00, currency: "USDT", category: "Conference", date: "2026-03-25", status: "pending", receiptUrl: null, receiptName: "aws_summit.pdf" },
  { id: "r-003", employeeName: "Marcus Rivera", description: "Uber rides (March)", amount: 87.50, currency: "USDT", category: "Transport", date: "2026-03-22", status: "pending", receiptUrl: null, receiptName: "uber_march.pdf" },
  { id: "r-004", employeeName: "James Liu", description: "GitHub Enterprise renewal", amount: 1200.00, currency: "USDT", category: "Software", date: "2026-03-20", status: "approved", receiptUrl: null, receiptName: "github_invoice.pdf" },
  { id: "r-005", employeeName: "Priya Sharma", description: "Office supplies", amount: 63.20, currency: "USDT", category: "Office", date: "2026-03-18", status: "paid", receiptUrl: null, receiptName: "supplies.jpg" },
  { id: "r-006", employeeName: "Daniel Park", description: "Figma team plan", amount: 450.00, currency: "USDT", category: "Software", date: "2026-03-15", status: "paid", receiptUrl: null, receiptName: "figma_invoice.pdf" },
];

// ---- Simulated extraction ----

function simulateExtract(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes("uber") || lower.includes("grab") || lower.includes("taxi"))
    return { description: "Ride service", amount: "42.50", category: "Transport", employee: "" };
  if (lower.includes("dinner") || lower.includes("lunch") || lower.includes("food") || lower.includes("meal"))
    return { description: "Business meal", amount: "128.90", category: "Meals", employee: "" };
  if (lower.includes("figma") || lower.includes("github") || lower.includes("notion") || lower.includes("aws"))
    return { description: "Software subscription", amount: "299.00", category: "Software", employee: "" };
  if (lower.includes("flight") || lower.includes("hotel") || lower.includes("airbnb"))
    return { description: "Travel expense", amount: "850.00", category: "Travel", employee: "" };
  return { description: "Office expense", amount: "0.00", category: "Other", employee: "" };
}

// ---- Right Sidebar Panel ----

function ReimbursementSidebar({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (r: Reimbursement) => void;
}) {
  const { openModal } = useModal();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  const [employee, setEmployee] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [selectedToken, setSelectedToken] = useState<{ symbol: string; icon: string } | null>(
    { symbol: "USDT", icon: "/token/usdt.svg" }
  );

  const resetForm = () => {
    setFile(null);
    setFilePreview(null);
    setEmployee("");
    setEmployeeEmail("");
    setDescription("");
    setAmount("");
    setCategory("");
    setSelectedToken({ symbol: "USDT", icon: "/token/usdt.svg" });
  };

  const handleFile = useCallback((f: File) => {
    setFile(f);

    // Generate preview for images
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }

    setExtracting(true);
    setTimeout(() => {
      const extracted = simulateExtract(f.name);
      setDescription(extracted.description);
      setAmount(extracted.amount);
      setCategory(extracted.category);
      setEmployee(extracted.employee);
      setExtracting(false);
      toast.success("Receipt data extracted");
    }, 1200);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!employee.trim()) { toast.error("Employee name is required"); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Valid amount is required"); return; }

    onSubmit({
      id: `r-${Date.now()}`,
      employeeName: employee.trim(),
      description: description.trim() || "Expense",
      amount: Number(amount),
      currency: selectedToken?.symbol || "USD",
      category: category || "Other",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      receiptUrl: filePreview,
      receiptName: file?.name || null,
    });

    toast.success("Reimbursement submitted");
    resetForm();
    onClose();
  };

  const inputClass = "bg-app-background rounded-xl border-b-2 border-primary-divider";
  const labelClass = "text-text-secondary text-sm font-medium";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Sidebar panel */}
      <div
        className="fixed top-0 right-0 h-full w-[460px] z-50 bg-background border-l border-primary-divider flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-divider">
          <div className="flex items-center gap-2">
            <img src="/sidebar/bill.svg" alt="" className="w-5 h-5" />
            <span className="text-text-primary font-bold">New Reimbursement</span>
          </div>
          <div
            className="w-7 h-7 bg-app-background rounded-lg flex justify-center items-center border-b-2 border-secondary-divider cursor-pointer"
            onClick={() => { resetForm(); onClose(); }}
          >
            <img src="/misc/close-icon.svg" alt="close" />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* Upload / Preview area */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors ${
                dragActive ? "border-primary-blue bg-blue-50" : "border-primary-divider bg-app-background"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.heic"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <img src="/sidebar/bill.svg" alt="" className="w-8 h-8 opacity-30" />
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-text-primary">Drop receipt here</p>
                <p className="text-xs text-text-secondary">JPG, PNG, PDF supported</p>
              </div>
              <SecondaryButton text="Choose File" onClick={() => inputRef.current?.click()} buttonClassName="w-fit px-5" variant="light" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Image preview */}
              {filePreview && (
                <div className="relative rounded-xl overflow-hidden border border-primary-divider bg-app-background">
                  <img src={filePreview} alt="Receipt" className="w-full max-h-[240px] object-contain" />
                </div>
              )}

              {/* PDF indicator */}
              {!filePreview && file && (
                <div className="rounded-xl border border-primary-divider bg-app-background flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-12 h-12 rounded-xl bg-[#E93544]/10 flex items-center justify-center">
                    <span className="text-[#E93544] text-sm font-bold">PDF</span>
                  </div>
                  <span className="text-text-primary text-sm font-medium">{file.name}</span>
                  <span className="text-text-secondary text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}

              {/* File info bar */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-app-background border border-primary-divider">
                <div className="w-8 h-8 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0">
                  <span className="text-primary-blue text-[10px] font-bold">{file.name.split(".").pop()?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">{file.name}</p>
                </div>
                {extracting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-primary-blue">Extracting...</span>
                  </div>
                ) : (
                  <Badge status={BadgeStatus.SUCCESS} text="Extracted" className="px-3" />
                )}
                <img
                  src="/misc/close-icon.svg"
                  alt="remove"
                  className="w-4 h-4 cursor-pointer opacity-40 hover:opacity-100"
                  onClick={resetForm}
                />
              </div>
            </div>
          )}

          {/* Form fields */}
          <div
            className={`${inputClass} cursor-pointer`}
            onClick={() =>
              openModal(MODAL_IDS.SELECT_EMPLOYEE, {
                onSave: (emp: any) => {
                  setEmployee(emp.name);
                  setEmployeeEmail(emp.email || "");
                },
              })
            }
          >
            <div className="flex items-center justify-between px-4 py-2">
              {employee ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue text-xs font-bold shrink-0">
                    {employee.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-primary text-sm font-medium">{employee}</span>
                    {employeeEmail && <span className="text-text-secondary text-xs">{employeeEmail}</span>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 flex-1">
                  <span className={labelClass}>Employee</span>
                  <span className="text-text-secondary text-sm">Select employee</span>
                </div>
              )}
              <img src="/arrow/chevron-down.svg" alt="" className="w-5 h-5" />
            </div>
          </div>

          <div className={inputClass}>
            <div className="flex flex-col gap-1 px-4 py-2">
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this expense for?"
                className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
              />
            </div>
          </div>

          {/* Token selector */}
          <div
            className={`${inputClass} cursor-pointer`}
            onClick={() =>
              openModal(MODAL_IDS.SELECT_TOKEN, {
                selectedToken: null,
                onTokenSelect: (token: any) => {
                  setSelectedToken({
                    symbol: token.metadata?.symbol || token.symbol || "USDT",
                    icon: `/token/${(token.metadata?.symbol || token.symbol || "usdt").toLowerCase()}.svg`,
                  });
                },
              })
            }
          >
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3 flex-1">
                {selectedToken ? (
                  <>
                    <img src={selectedToken.icon} alt="" className="w-8 h-8" />
                    <div className="flex flex-col">
                      <span className={labelClass}>Reimburse with</span>
                      <span className="text-text-primary text-sm font-medium">{selectedToken.symbol}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className={labelClass}>Reimburse with</span>
                    <span className="text-text-secondary text-sm">Select token</span>
                  </div>
                )}
              </div>
              <img src="/arrow/chevron-down.svg" alt="" className="w-5 h-5" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className={`flex-1 ${inputClass}`}>
              <div className="flex flex-col gap-1 px-4 py-2">
                <label className={labelClass}>Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                />
              </div>
            </div>
            <div className={`flex-1 ${inputClass}`}>
              <div className="flex flex-col gap-1 px-4 py-2">
                <label className={labelClass}>Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Meals, Transport"
                  className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 p-5 border-t border-primary-divider">
          <SecondaryButton text="Cancel" onClick={() => { resetForm(); onClose(); }} variant="light" buttonClassName="flex-1" />
          <PrimaryButton text="Submit" onClick={handleSubmit} containerClassName="flex-1" disabled={extracting} />
        </div>
      </div>
    </>
  );
}

// ---- Receipt Preview Modal ----

function ReceiptPreviewModal({
  isOpen,
  onClose,
  reimbursement,
}: {
  isOpen: boolean;
  onClose: () => void;
  reimbursement: Reimbursement | null;
}) {
  if (!isOpen || !reimbursement) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Receipt Preview" onClose={onClose} icon="/sidebar/bill.svg" />
      <div className="flex flex-col w-[480px] p-5 rounded-b-2xl border-2 border-t-0 border-primary-divider bg-background gap-4">
        {reimbursement.receiptUrl && (
          <div className="rounded-xl overflow-hidden border border-primary-divider bg-app-background">
            <img src={reimbursement.receiptUrl} alt="Receipt" className="w-full max-h-[280px] object-contain" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {[
            { label: "From", value: reimbursement.employeeName },
            { label: "Description", value: reimbursement.description },
            { label: "Amount", value: `$${reimbursement.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, bold: true },
            { label: "Date", value: new Date(reimbursement.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
          ].map(({ label, value, bold }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">{label}</span>
              <span className={`text-text-primary text-sm ${bold ? "font-bold" : "font-medium"}`}>{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Category</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-app-background border border-primary-divider text-text-primary">
              {reimbursement.category}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Status</span>
            <Badge
              status={
                reimbursement.status === "paid" ? BadgeStatus.SUCCESS
                  : reimbursement.status === "rejected" ? BadgeStatus.FAIL
                  : reimbursement.status === "approved" ? BadgeStatus.AWAITING
                  : BadgeStatus.NEUTRAL
              }
              text={reimbursement.status.charAt(0).toUpperCase() + reimbursement.status.slice(1)}
              className="px-3"
            />
          </div>
        </div>

        <SecondaryButton text="Close" onClick={onClose} variant="light" />
      </div>
    </BaseModal>
  );
}


// ---- Main Page ----

const ReimbursementPage = () => {
  const router = useRouter();
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>(MOCK_REIMBURSEMENTS);
  const [showSidebar, setShowSidebar] = useState(false);
  const [previewItem, setPreviewItem] = useState<Reimbursement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pending = reimbursements.filter((r) => r.status === "pending" || r.status === "approved");
  const pendingTotal = pending.reduce((sum, r) => sum + r.amount, 0);

  const handleAddReimbursement = (r: Reimbursement) => {
    setReimbursements((prev) => [r, ...prev]);
  };

  const handlePayAll = () => {
    router.push("/reimbursement/review");
  };

  const tableHeaders = ["Employee", "Description", "Category", "Date", "Amount", "Status", "Receipt"];

  const tableData = reimbursements.map((r) => ({
    Employee: (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#7D52F4]/10 flex items-center justify-center text-[#7D52F4] text-xs font-bold shrink-0">
          {r.employeeName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <span className="text-text-primary text-sm font-medium">{r.employeeName}</span>
      </div>
    ),
    Description: <span className="text-text-primary text-sm">{r.description}</span>,
    Category: (
      <div className="flex items-center justify-center">
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-app-background border border-primary-divider text-text-primary">
          {r.category}
        </span>
      </div>
    ),
    Date: (
      <span className="text-text-secondary text-sm">
        {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    ),
    Amount: (
      <div className="flex items-center justify-center gap-1.5">
        <img src={`/token/${r.currency.toLowerCase()}.svg`} alt={r.currency} className="w-4 h-4" />
        <span className="text-text-primary text-sm font-medium">
          {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.currency}
        </span>
      </div>
    ),
    Status: (
      <div className="flex justify-center">
        <Badge
          status={
            r.status === "paid" ? BadgeStatus.SUCCESS
              : r.status === "rejected" ? BadgeStatus.FAIL
              : r.status === "approved" ? BadgeStatus.AWAITING
              : BadgeStatus.NEUTRAL
          }
          text={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          className="px-3"
        />
      </div>
    ),
    Receipt: r.receiptName ? (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 bg-app-background rounded-full px-2.5 py-1 border border-primary-divider">
          <span className="text-primary-blue text-[10px] font-bold">
            {r.receiptName.split(".").pop()?.toUpperCase()}
          </span>
          <span className="text-text-secondary text-xs">View</span>
        </div>
      </div>
    ) : (
      <span className="text-text-secondary text-xs text-center block">No receipt</span>
    ),
  }));

  const handleRowClick = (_: Record<string, any>, index: number) => {
    setPreviewItem(reimbursements[index]);
  };

  return (
    <div className="w-full h-full p-5 flex flex-col items-start gap-4">
      <PageHeader
        icon="/sidebar/bill.svg"
        label="Reimbursement"
        button={
          <div className="flex items-center gap-2">
            <SecondaryButton
              text="New Reimbursement"
              variant="light"
              onClick={() => setShowSidebar(true)}
              buttonClassName="px-5"
            />
            <PrimaryButton
              text={`Pay All (${pending.length})`}
              onClick={handlePayAll}
              containerClassName="w-fit"
              buttonClassName="px-5"
              disabled={pending.length === 0}
            />
          </div>
        }
      />

      {/* Stat cards */}
      <div className="flex gap-3 w-full">
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Pending Requests</span>
          <span className="text-text-primary text-xl font-bold">{pending.length}</span>
        </div>
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Pending Amount</span>
          <span className="text-text-primary text-xl font-bold">${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Total This Month</span>
          <span className="text-text-primary text-xl font-bold">{reimbursements.length}</span>
        </div>
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Paid This Month</span>
          <span className="text-text-primary text-xl font-bold">
            ${reimbursements.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Reimbursements table */}
      <BaseContainer
        header={
          <div className="w-full flex items-center justify-between px-6 py-4">
            <span className="text-text-primary font-medium">Reimbursements</span>
            <span className="text-text-secondary text-sm">{reimbursements.length} requests</span>
          </div>
        }
        containerClassName="w-full"
      >
        <div className="w-full p-5">
          <Table
            data={tableData}
            headers={tableHeaders}
            showFooter={false}
            showPagination={true}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            onRowClick={handleRowClick}
          />
        </div>
      </BaseContainer>

      {/* Right sidebar for new reimbursement */}
      <ReimbursementSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSubmit={handleAddReimbursement}
      />

      {/* Receipt preview modal */}
      <ReceiptPreviewModal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        reimbursement={previewItem}
      />

      {/* Pay all modal removed - now navigates to /reimbursement/review */}
    </div>
  );
};

export default ReimbursementPage;
