"use client";
import { n } from "@/services/utils/normalizeToken";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import InputOutlined from "@/components/Common/Input/InputOutlined";
import { PrimaryButton } from "@/components/Common/PrimaryButton";
import { SecondaryButton } from "@/components/Common/SecondaryButton";
import { DueDateDropdown } from "@/components/Common/Dropdown/DueDateDropdown";
import InvoicePreview from "../Common/Invoice/InvoicePreview";
import { useModal } from "@/contexts/ModalManagerProvider";
import { MODAL_IDS, PermissionRequiredModalProps } from "@/types/modal";
import { createB2BInvoice, sendB2BInvoice } from "@/services/api/invoice";
import { useGetMyCompany } from "@/services/api/company";
import { useListAccountsByCompany } from "@/services/api/multisig";
import {
  CreateB2BInvoiceDto,
  Currency,
  InvoiceItemDto,
  B2BFromDetailsDto,
  UnregisteredCompanyDto,
} from "@qash/types/dto/invoice";
import { NetworkDto } from "@qash/types/dto/network";
import { TokenDto } from "@qash/types/dto/token";
import { ClientResponseDto } from "@qash/types/dto/client";
import { AssetWithMetadata } from "@/types/faucet";
import { useAuth } from "@/services/auth/context";
import { AuthMeResponse } from "@/services/auth/api";
import { useDemo } from "@/contexts/DemoProvider";
import { InvoiceModalProps } from "@/types/modal";
import { trackEvent } from "@/services/analytics/posthog";
import { PostHogEvent } from "@/types/posthog";

interface FormItem {
  description: string;
  price: string;
  qty: string;
  amount: string;
}

interface FormData {
  name: string;
  companyName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: Currency;
  clientId: string;
  billToCompanyName: string;
  billToContactName: string;
  billToEmail: string;
  billToAddress: string;
  billToCcEmails: string[];
  billToTaxId: string;
  token: TokenDto | null;
  network: NetworkDto | null;
  walletAddress: string;
  items: FormItem[];
  taxRate: string;
  discount: string;
  note: string;
  emailSubject: string;
  emailBody: string;
  emailBcc: string[];
  paymentCollectionType: "one-time" | "recurring";
  recurringInterval: string;
  recurringStartDate: string;
  paymentMethodId: string;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-text-primary">{children}</h2>
);

const SectionDivider = () => <div className="h-px w-full bg-primary-divider" />;

const CreateClientInvoice = () => {
  const { openModal } = useModal();
  const router = useRouter();
  const { user } = useAuth();
  const { data: demoData } = useDemo();
  const invoiceSettings = demoData?.invoiceSettings;
  const { data: myCompany } = useGetMyCompany();
  const { data: multisigAccounts, isLoading: accountsLoading } = useListAccountsByCompany(myCompany?.id, {
    enabled: !!myCompany?.id,
  });
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [expandFromDetails, setExpandFromDetails] = useState(false);
  const [expandBillToDetails, setExpandBillToDetails] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<{ icon: string; name: string; value: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [ccEmailInput, setCcEmailInput] = useState("");

  const isAdmin = user?.teamMembership?.role === "ADMIN" || user?.teamMembership?.role === "OWNER";

  useEffect(() => {
    if (user && !isAdmin) {
      openModal<PermissionRequiredModalProps>(MODAL_IDS.PERMISSION_REQUIRED, {
        role: user?.teamMembership?.role,
        onConfirm: () => router.push("/"),
      });
    }
  }, [user, isAdmin]);

  const { register, watch, setValue, formState: { errors } } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: {
      name: "", email: "", companyName: "", address: "", city: "", state: "", country: "", postalCode: "", taxId: "",
      invoiceNumber: "", issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: Currency.USD,
      clientId: "", billToCompanyName: "", billToContactName: "", billToEmail: "", billToAddress: "", billToCcEmails: [], billToTaxId: "",
      token: { address: "", symbol: "USDT", decimals: 6, name: "USDT" },
      network: { name: "Miden Testnet", chainId: 1 },
      walletAddress: "",
      items: [
        { description: "Smart contract development", price: "8000", qty: "1", amount: "8000" },
        { description: "Security audit", price: "3500", qty: "1", amount: "3500" },
      ],
      taxRate: "0", discount: "0", note: "",
      emailSubject: "", emailBody: "", emailBcc: [],
      paymentCollectionType: "one-time", recurringInterval: "MONTHLY", recurringStartDate: "",
      paymentMethodId: "payroll",
    },
  });

  const formData = watch();

  useEffect(() => {
    if (multisigAccounts && multisigAccounts.length > 0) {
      const first = multisigAccounts[0];
      setValue("paymentMethodId", first.accountId);
      setValue("walletAddress", first.accountId);
    }
  }, [multisigAccounts]);

  // Apply invoice settings defaults
  useEffect(() => {
    if (invoiceSettings) {
      const num = String(invoiceSettings.nextInvoiceNumber).padStart(4, "0");
      setValue("invoiceNumber", `${invoiceSettings.invoicePrefix}${num}`);
      if (invoiceSettings.defaultNote) setValue("note", invoiceSettings.defaultNote);
    }
  }, [invoiceSettings]);

  useEffect(() => {
    if (myCompany) {
      const address = [myCompany.address1, myCompany.address2, myCompany.city, myCompany.postalCode].filter(Boolean).join(", ");
      setValue("companyName", myCompany.companyName);
      setValue("address", address);
    }
  }, [myCompany]);

  useEffect(() => {
    if (user) {
      const first = (user as AuthMeResponse["user"])?.teamMembership?.firstName ?? "";
      const last = (user as AuthMeResponse["user"])?.teamMembership?.lastName ?? "";
      const fullName = [first, last].filter(Boolean).join(" ");
      const email = (user as AuthMeResponse["user"])?.email ?? "";
      if (fullName) setValue("name", fullName);
      if (email) setValue("email", email);
    }
  }, [user]);

  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) || 0) * (parseInt(item.qty) || 0);
    }, 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discount = parseFloat(formData.discount) || 0;
    return { subtotal, taxAmount, total: subtotal + taxAmount - discount };
  }, [formData.items, formData.taxRate, formData.discount]);

  const buildCreateInvoiceDto = (): CreateB2BInvoiceDto => {
    const items: InvoiceItemDto[] = formData.items.map((item, index) => ({
      description: item.description,
      quantity: item.qty,
      unitPrice: item.price,
      total: item.amount || String(parseFloat(item.price) * parseInt(item.qty)),
      order: index,
    }));
    const fromDetails: B2BFromDetailsDto = {
      companyName: formData.companyName, contactName: formData.name, email: formData.email,
      address1: formData.address, city: formData.city, state: formData.state,
      country: formData.country, postalCode: formData.postalCode, taxId: formData.taxId,
    };
    const unregisteredCompany: UnregisteredCompanyDto | undefined = formData.clientId
      ? undefined
      : {
          companyName: formData.billToCompanyName, email: formData.billToEmail,
          ccEmails: formData.billToCcEmails.filter(Boolean), contactName: formData.billToContactName,
          address: formData.billToAddress, taxId: formData.billToTaxId,
        };
    return {
      clientId: formData.clientId || undefined, unregisteredCompany,
      issueDate: formData.issueDate || new Date().toISOString(), dueDate: formData.dueDate,
      currency: formData.currency, items, network: formData.network!, token: formData.token!,
      walletAddress: formData.walletAddress, fromDetails,
      emailSubject: formData.emailSubject || undefined, emailBody: formData.emailBody || undefined,
      emailBcc: formData.emailBcc.filter(Boolean),
      taxRate: formData.taxRate, discount: formData.discount,
      memo: formData.note ? { text: formData.note } : undefined,
    };
  };

  const handleClientSelect = (client: ClientResponseDto) => {
    setValue("clientId", client.uuid);
    setValue("billToCompanyName", client.companyName);
    setValue("billToEmail", client.email);
    setValue("billToContactName", "");
    setValue("billToAddress", [client.address1, client.address2, client.city, client.state, client.postalCode, client.country].filter(Boolean).join(", "));
    setValue("billToTaxId", client.taxId || "");
  };

  const handleTokenSelect = (token: AssetWithMetadata | null) => {
    if (!token) return;
    setValue("token", { address: token.faucetId, symbol: token.metadata.symbol, decimals: token.metadata.decimals, name: token.metadata.symbol });
  };

  const handleNetworkSelect = (network: { icon: string; name: string; value: string }) => {
    setSelectedNetwork(network);
    setValue("network", { name: network.name, chainId: 1 });
  };

  const handleMultisigAccountSelect = (accountId: string) => {
    setValue("paymentMethodId", accountId);
    setValue("walletAddress", accountId);
  };

  const handleAddItem = () => {
    setValue("items", [...formData.items, { description: "", price: "", qty: "1", amount: "0" }]);
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: string) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    item[field] = value;
    if (field === "price" || field === "qty") {
      item.amount = String((parseFloat(item.price) || 0) * (parseInt(item.qty) || 0));
    }
    newItems[index] = item;
    setValue("items", newItems);
  };

  const handleRemoveItem = (index: number) => {
    setValue("items", formData.items.filter((_, i) => i !== index));
  };

  const handleAddCcEmail = () => {
    const email = ccEmailInput.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email"); return; }
    if (formData.billToCcEmails.includes(email)) { toast.error("Email already added"); return; }
    setValue("billToCcEmails", [...formData.billToCcEmails, email]);
    setCcEmailInput("");
  };

  const handleSendInvoice = async () => {
    if (!formData.billToCompanyName && !formData.billToEmail) { toast.error("Please select a client or enter recipient info"); return; }
    if (formData.items.length === 0) { toast.error("Please add at least one item"); return; }
    if (!formData.walletAddress) { toast.error("Please select a receiving account"); return; }

    setIsLoading(true);
    try {
      let invoice = createdInvoice;
      if (!invoice) {
        const dto = buildCreateInvoiceDto();
        invoice = await createB2BInvoice(dto);
        setCreatedInvoice(invoice);
      }
      if (!invoice?.uuid) throw new Error("Failed to create invoice");
      await sendB2BInvoice(invoice.uuid);

      // Store invoice for public review page
      const publicInvoice = {
        uuid: invoice.uuid,
        invoiceNumber: invoice.invoiceNumber || formData.invoiceNumber,
        status: "SENT",
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        currency: formData.currency,
        total: total,
        subtotal: subtotal,
        fromDetails: { companyName: formData.companyName, contactName: formData.name, email: formData.email, address1: formData.address },
        toDetails: { companyName: formData.billToCompanyName, contactName: formData.billToContactName, email: formData.billToEmail, address: formData.billToAddress },
        toCompanyName: formData.billToCompanyName,
        toCompanyEmail: formData.billToEmail,
        items: formData.items.map((item, i) => ({ description: item.description, quantity: item.qty, unitPrice: item.price, total: item.amount, order: i })),
        paymentToken: { name: formData.token?.symbol || "USDT", symbol: formData.token?.symbol || "USDT" },
        paymentNetwork: { name: formData.network?.name || "Miden" },
        paymentWalletAddress: formData.walletAddress,
        memo: formData.note ? { text: formData.note } : null,
      };
      const storedInvoices = JSON.parse(localStorage.getItem("qash_demo_invoices") || "{}");
      storedInvoices[invoice.uuid] = publicInvoice;
      localStorage.setItem("qash_demo_invoices", JSON.stringify(storedInvoices));

      setInvoiceSent(true);
      trackEvent(PostHogEvent.INVOICE_CREATED);
      toast.success("Invoice sent successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to send invoice";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  if (user && !isAdmin) return null;

  if (invoiceSent) {
    return (
      <div className="flex flex-col gap-5 items-center justify-center w-full h-full">
        <img src="/modal/green-circle-check.gif" alt="success" className="w-16 h-16" />
        <h1 className="text-4xl font-semibold text-center">Invoice sent successfully</h1>
        <p className="text-base font-medium text-text-secondary text-center">
          Invoice of <span className="font-bold text-text-primary">{total.toFixed(2)} {formData.token?.symbol || "USDT"}</span>
          {" has been sent to "}<span className="text-primary-blue">{formData.billToEmail}</span>
        </p>
        <div className="flex gap-4 items-center">
          <SecondaryButton text="View Invoice" variant="light" buttonClassName="w-[130px]" icon="/misc/eye-icon.svg" iconPosition="left"
            onClick={() => {
              openModal<InvoiceModalProps>("INVOICE_MODAL", {
                invoice: {
                  amountDue: total.toFixed(2),
                  billTo: { name: formData.billToContactName || "", company: formData.billToCompanyName || "", address: formData.billToAddress || "", email: formData.billToEmail || "" },
                  paymentToken: { name: n(formData.token?.symbol) || "USDT" },
                  currency: formData.currency || "USD",
                  date: formData.issueDate, dueDate: formData.dueDate,
                  from: { name: formData.name || "", address: formData.address || "", email: formData.email || "", company: formData.companyName || "" },
                  invoiceNumber: createdInvoice?.invoiceNumber || formData.invoiceNumber || "",
                  items: formData.items.map(item => ({ name: item.description, rate: parseFloat(item.price) || 0, qty: parseFloat(item.qty) || 0, amount: parseFloat(item.amount) || 0 })),
                  subtotal, tax: 0, total,
                  walletAddress: formData.walletAddress || "", network: "Miden",
                },
              });
            }}
          />
          <PrimaryButton
            text="Copy Link"
            icon="/misc/thin-copy-icon.svg"
            iconPosition="left"
            containerClassName="w-36"
            onClick={async () => {
              const invoiceUrl = `${window.location.origin}/invoice-review/b2b?uuid=${createdInvoice?.uuid}`;
              try {
                await navigator.clipboard.writeText(invoiceUrl);
                toast.success("Invoice link copied!");
              } catch {
                toast.error("Failed to copy link");
              }
            }}
          />
        </div>

        <button
          onClick={() => router.push("/invoice")}
          className="flex gap-2 items-center text-primary-blue font-medium text-sm hover:opacity-80 transition-opacity cursor-pointer"
        >
          Go to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-row relative h-full bg-background">
      {/* Left: Form (60%) */}
      <div className="w-[60%] flex flex-col gap-6 p-6 overflow-y-auto pb-24">
        {/* Back */}
        <button onClick={() => router.push("/invoice")} className="flex gap-1 items-center text-[#066eff] hover:opacity-80 transition-opacity cursor-pointer w-fit">
          <img src="/arrow/chevron-left.svg" alt="back" className="w-5 h-5" />
          <span className="font-medium text-sm">Back to Invoices</span>
        </button>

        <h1 className="text-2xl font-bold text-text-primary">Create Invoice</h1>

        {/* === Section 1: Your Information === */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Your Information</SectionTitle>
          <div className="flex gap-3">
            <InputOutlined label="Name" placeholder="Your name" {...register("name")} containerClassName="flex-1" />
            <InputOutlined label="Email" placeholder="your@email.com" type="email" {...register("email")} containerClassName="flex-1" />
          </div>
          <InputOutlined label="Company name" placeholder="Company name" {...register("companyName")} />
          <button onClick={() => setExpandFromDetails(!expandFromDetails)} className="flex gap-1 items-center text-text-secondary cursor-pointer w-fit text-sm">
            <span>Additional details</span>
            <img src="/arrow/chevron-down.svg" alt="" className={`w-4 h-4 transition-transform ${expandFromDetails ? "rotate-180" : ""}`} />
          </button>
          {expandFromDetails && <InputOutlined label="Address" placeholder="Enter address" {...register("address")} />}
        </div>

        <SectionDivider />

        {/* === Section 2: Bill To === */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Bill To</SectionTitle>
          <InputOutlined
            label="Client"
            placeholder="Select client"
            value={formData.billToCompanyName}
            onChange={() => {}}
            readOnly
            icon="/misc/address-book-icon.svg"
            iconOnClick={() => openModal("SELECT_CLIENT", { onSave: handleClientSelect })}
          />
          <InputOutlined label="Email" placeholder="client@email.com" type="email" {...register("billToEmail")} />
          <button onClick={() => setExpandBillToDetails(!expandBillToDetails)} className="flex gap-1 items-center text-text-secondary cursor-pointer w-fit text-sm">
            <span>Additional details</span>
            <img src="/arrow/chevron-down.svg" alt="" className={`w-4 h-4 transition-transform ${expandBillToDetails ? "rotate-180" : ""}`} />
          </button>
          {expandBillToDetails && <InputOutlined label="Address" placeholder="Enter address" {...register("billToAddress")} />}
        </div>

        <SectionDivider />

        {/* === Section 3: Invoice Details === */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Invoice Details</SectionTitle>
          <div className="flex gap-3">
            <div className="flex-1">
              <InputOutlined label="Invoice number" placeholder="Auto-generated" disabled {...register("invoiceNumber")} />
            </div>
            <div className="flex-1">
              <DueDateDropdown selectedDate={formData.dueDate} onDateSelect={date => setValue("dueDate", date)} />
            </div>
          </div>
          <div className="flex gap-3">
            <InputOutlined label="Token" placeholder="Select token" value={formData.token?.symbol || ""} onChange={() => {}} readOnly
              icon="/arrow/chevron-down.svg" iconOnClick={() => openModal("SELECT_TOKEN", { onTokenSelect: handleTokenSelect })}
              containerClassName="flex-1"
            />
            <InputOutlined label="Network" placeholder="Select network" value={formData.network?.name || ""} onChange={() => {}} readOnly
              icon="/arrow/chevron-down.svg" iconOnClick={() => openModal("SELECT_NETWORK", { onNetworkSelect: handleNetworkSelect })}
              containerClassName="flex-1"
            />
          </div>
        </div>

        <SectionDivider />

        {/* === Section 4: Items === */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Items</SectionTitle>
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-2 items-end w-full">
              <InputOutlined label="Item" placeholder="Description" name="description" value={item.description}
                onChange={e => handleItemChange(index, "description", e.target.value)} containerClassName="flex-1" />
              <InputOutlined label="Price" placeholder="0.00" name="price" type="number" value={item.price}
                onChange={e => handleItemChange(index, "price", e.target.value)} containerClassName="w-28" />
              <InputOutlined label="Qty" placeholder="1" name="qty" type="number" value={item.qty}
                onChange={e => handleItemChange(index, "qty", e.target.value)} containerClassName="w-20" />
              <InputOutlined label="Amount" placeholder="0.00" name="amount" type="number" value={item.amount}
                containerClassName="w-28" />
              <button onClick={() => handleRemoveItem(index)} className="flex justify-center items-center w-10 h-10 border border-primary-divider rounded-lg text-text-secondary hover:border-red-500 hover:text-red-500 transition-colors mb-0.5 shrink-0" title="Remove">
                <span className="text-lg leading-none">&minus;</span>
              </button>
            </div>
          ))}
          <button onClick={handleAddItem} className="w-full border border-dashed border-primary-divider rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-app-background transition-colors text-sm text-text-secondary">
            <img src="/misc/circle-plus-icon.svg" alt="add" className="w-4 h-4" />
            Add item
          </button>
        </div>

        <SectionDivider />

        {/* === Section 5: Receive Payment === */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Receive Payment To</SectionTitle>
          <div className="flex flex-col gap-2">
            {accountsLoading ? (
              <div className="w-full py-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border border-primary-divider border-t-primary-blue" />
              </div>
            ) : !multisigAccounts || multisigAccounts.length === 0 ? (
              <p className="text-sm text-text-secondary">No accounts found. Create a multisig account first.</p>
            ) : (
              multisigAccounts.map(account => (
                <button key={account.accountId} onClick={() => handleMultisigAccountSelect(account.accountId)}
                  className={`w-full flex gap-3 items-center px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    formData.paymentMethodId === account.accountId ? "border-primary-blue bg-blue-50/50" : "border-primary-divider"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    formData.paymentMethodId === account.accountId ? "bg-primary-blue" : "border-2 border-primary-divider"
                  }`}>
                    {formData.paymentMethodId === account.accountId && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <img src="/client-invoice/payroll-icon.svg" alt="" className="w-7" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-text-secondary font-mono truncate">{account.accountId}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <SectionDivider />

        {/* === Section 6: Note === */}
        <div className="flex flex-col gap-2">
          <SectionTitle>Note</SectionTitle>
          <textarea placeholder="Add a note (optional)" {...register("note")}
            className="w-full h-20 border border-primary-divider rounded-lg p-3 placeholder-text-secondary focus:outline-none focus:border-primary-blue text-sm" />
        </div>

        {/* === Section 7: Email CC === */}
        <div className="flex flex-col gap-2">
          <SectionTitle>CC Recipients (optional)</SectionTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {formData.billToCcEmails.map((email, index) => (
              <div key={index} className="bg-app-background rounded-lg px-3 py-1 flex items-center gap-2 text-sm">
                <span>{email}</span>
                <button onClick={() => setValue("billToCcEmails", formData.billToCcEmails.filter((_, i) => i !== index))} className="text-text-secondary hover:text-red-500">&times;</button>
              </div>
            ))}
            <input type="email" placeholder="Add CC email" value={ccEmailInput} onChange={e => setCcEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCcEmail(); } }}
              onBlur={() => { if (ccEmailInput.trim()) handleAddCcEmail(); }}
              className="text-sm placeholder-text-secondary outline-none flex-1 min-w-[150px] py-1" />
          </div>
        </div>
      </div>

      {/* Right: Live Preview */}
      {/* Right: Live Preview (40%) */}
      <div className="w-[40%] shrink-0 overflow-y-auto" style={{ ["--invoice-accent" as any]: invoiceSettings?.accentColor || "#194BFA" }}>
      <InvoicePreview
        logo={invoiceSettings?.logo}
        invoiceNumber={createdInvoice?.invoiceNumber || formData.invoiceNumber || ""}
        date={formatDate(createdInvoice?.issueDate || formData.issueDate || "")}
        dueDate={formatDate(createdInvoice?.dueDate || formData.dueDate || "")}
        from={{
          name: formData.name || "", email: formData.email || "", company: formData.companyName || "",
          address: formData.address || "", token: formData.token?.symbol || "",
          network: formData.network?.name || "", walletAddress: formData.walletAddress || "",
        }}
        billTo={{
          name: formData.billToContactName || "", company: formData.billToCompanyName || "",
          email: formData.billToEmail || "", address: formData.billToAddress || "",
        }}
        items={formData.items.map(item => ({
          description: item.description, qty: parseInt(item.qty) || 0,
          price: parseFloat(item.price) || 0, amount: parseFloat(item.amount) || 0,
          currency: formData.currency || "USD",
        }))}
        note={formData.note || ""}
        subtotal={subtotal}
        total={total}
        amountDue={total}
        currency={formData.currency || "USD"}
        status={createdInvoice?.status || "DRAFT"}
      />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-white/70 border-t border-primary-divider flex items-center justify-end px-10 py-4 z-10">
        <PrimaryButton
          text={isLoading ? "Sending..." : "Send Invoice"}
          onClick={handleSendInvoice}
          containerClassName="w-36"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default CreateClientInvoice;
