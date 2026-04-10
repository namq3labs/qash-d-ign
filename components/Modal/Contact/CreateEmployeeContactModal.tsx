"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CreateEmployeeContactModalProps } from "@/types/modal";
import { ModalProp } from "@/contexts/ModalManagerProvider";
import BaseModal from "../BaseModal";
import { ModalHeader } from "../../Common/ModalHeader";
import { PrimaryButton } from "../../Common/PrimaryButton";
import { SecondaryButton } from "../../Common/SecondaryButton";
import { CategoryDropdown } from "../../Common/Dropdown/CategoryDropdown";
import { useModal } from "@/contexts/ModalManagerProvider";
import { MODAL_IDS } from "@/types/modal";
import { AssetWithMetadata } from "@/types/faucet";
import toast from "react-hot-toast";
import { CompanyGroupResponseDto, CreateContactDto } from "@qash/types/dto/employee";
import {
  useCheckEmployeeAddressDuplicate,
  useCheckEmployeeNameDuplicate,
  useCreateEmployee,
  useGetAllEmployeeGroups,
} from "@/services/api/employee";
import { EmployeeGroupDropdown } from "@/components/Common/Dropdown/EmployeeGroupDropdown";
import { useAuth } from "@/services/auth/context";
import {
  QASH_TOKEN_ADDRESS,
  QASH_TOKEN_DECIMALS,
  QASH_TOKEN_MAX_SUPPLY,
  QASH_TOKEN_SYMBOL,
} from "@/services/utils/constant";
import { blo } from "blo";
import { turnBechToHex } from "@/services/utils/turnBechToHex";
import { NetworkDto } from "@qash/types/dto/network";
import { TokenDto } from "@qash/types/dto/token";
import { FiatPayoutFields, FiatPayoutData } from "@/components/Common/FiatPayoutFields";
import InvoicePreview from "@/components/Common/Invoice/InvoicePreview";
import { useGetMyCompany } from "@/services/api/company";
import { n } from "@/services/utils/normalizeToken";

interface CreateContactFormData {
  name: string;
  walletAddress: string;
  email: string;
  groupId?: number;
  // Payroll fields (step 2)
  duration: string;
  durationUnit: "month" | "year";
  monthlyAmount: string;
  description: string;
  note: string;
}

interface FormInputProps {
  label: string;
  placeholder: string;
  type?: string;
  register: any;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const FormInput = ({ label, placeholder, type = "text", register, error, disabled, required }: FormInputProps) => (
  <div className="flex flex-col gap-2">
    <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
      <div className="flex flex-col gap-1 px-4 py-2">
        <label className="text-text-secondary text-sm font-medium">
          {label} {!required && <span className="text-text-secondary">(Optional)</span>}
        </label>
        <input
          {...register}
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
          autoFocus={label === "Name"}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
    {error && (
      <div className="flex items-center gap-1 pl-2">
        <img src="/misc/red-circle-warning.svg" alt="warning" className="w-4 h-4" />
        <span className="text-[#E93544] text-sm">{error}</span>
      </div>
    )}
  </div>
);

const DEFAULT_TOKEN: AssetWithMetadata = {
  amount: "0",
  faucetId: QASH_TOKEN_ADDRESS,
  metadata: {
    symbol: QASH_TOKEN_SYMBOL,
    decimals: QASH_TOKEN_DECIMALS,
    maxSupply: QASH_TOKEN_MAX_SUPPLY,
  },
};

const DEFAULT_NETWORK: { icon: string; name: string; value: string } = {
  icon: "/chain/miden.svg",
  name: "Miden Testnet",
  value: "miden",
};

export function CreateEmployeeContactModal({ isOpen, onClose, zIndex }: ModalProp<CreateEmployeeContactModalProps>) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedToken, setSelectedToken] = useState<AssetWithMetadata | null>(DEFAULT_TOKEN);
  const [selectedNetwork, setSelectedNetwork] = useState<{ icon: string; name: string; value: string } | null>(
    DEFAULT_NETWORK,
  );
  const [selectedGroup, setSelectedGroup] = useState<CompanyGroupResponseDto | undefined>(undefined);
  const [paymentType, setPaymentType] = useState<"crypto" | "fiat">("crypto");
  const [selectedPayDay, setSelectedPayDay] = useState(28);
  const [fiatData, setFiatData] = useState<FiatPayoutData>({
    country: "Singapore",
    countryCode: "SG",
    currency: "SGD",
    bankName: "DBS Bank",
    accountNumber: "0129876543",
    accountHolder: "Sarah Chen",
    routingOrSwift: "DBSSSGSG",
  });
  const { openModal, closeModal } = useModal();

  const networkChainIds: Record<string, number> = useMemo(
    () => ({
      eth: 1,
      miden: 0,
      sol: 0,
      base: 8453,
      bnb: 56,
    }),
    [],
  );

  const { data: employeeGroups = [] } = useGetAllEmployeeGroups({ enabled: isAuthenticated });
  const { data: company } = useGetMyCompany();
  const createEmployee = useCreateEmployee();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitted, touchedFields },
    reset,
    setValue,
    watch,
    clearErrors,
    trigger,
  } = useForm<CreateContactFormData>({
    mode: "all",
    defaultValues: {
      name: "Sarah Chen",
      walletAddress: "mtst1p2k8n7q5v0a3x9y4z6w8m1j0h2g4f5d7s9l3r6t",
      email: "sarah.chen@company.com",
      groupId: undefined,
      duration: "12",
      durationUnit: "month",
      monthlyAmount: "5000",
      description: "Monthly salary",
      note: "",
    },
  });

  // Only show errors for fields the user has touched
  const visibleErrors = {
    name: touchedFields.name ? errors.name : undefined,
    walletAddress: touchedFields.walletAddress ? errors.walletAddress : undefined,
    email: touchedFields.email ? errors.email : undefined,
    groupId: touchedFields.groupId ? errors.groupId : undefined,
  };

  const watchedName = watch("name");
  const watchedAddress = watch("walletAddress");

  const { data: nameDuplicate } = useCheckEmployeeNameDuplicate();
  const { data: addressDuplicate } = useCheckEmployeeAddressDuplicate();

  // Reset to defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedToken(DEFAULT_TOKEN);
      setSelectedNetwork(DEFAULT_NETWORK);
      setSelectedGroup(undefined);
      setPaymentType("crypto");
      setSelectedPayDay(28);
      setFiatData({
        country: "Singapore",
        countryCode: "SG",
        currency: "SGD",
        bankName: "DBS Bank",
        accountNumber: "0129876543",
        accountHolder: "Sarah Chen",
        routingOrSwift: "DBSSSGSG",
      });
      reset(
        {
          name: "Sarah Chen",
          walletAddress: "mtst1p2k8n7q5v0a3x9y4z6w8m1j0h2g4f5d7s9l3r6t",
          email: "sarah.chen@company.com",
          groupId: undefined,
          duration: "12",
          durationUnit: "month",
          monthlyAmount: "5000",
          description: "Monthly salary",
          note: "",
        },
        { keepErrors: false, keepIsSubmitted: false, keepTouched: false },
      );
      clearErrors();
    }
  }, [isOpen, reset, clearErrors]);

  const groupIdRegister = register("groupId", {
    required: "Group is required",
  });

  const nameRegister = register("name", {
    required: "Name is required",
    minLength: {
      value: 1,
      message: "Name must be at least 1 character",
    },
    maxLength: {
      value: 100,
      message: "Name cannot exceed 100 characters",
    },
    pattern: {
      value: /^[a-zA-Z0-9\s\-_]+$/,
      message: "Name can only contain letters, numbers, spaces, hyphens, and underscores",
    },
    validate: () => {
      if (!selectedGroup) return true;
      if (nameDuplicate?.isDuplicate) return "This name already exists in the selected group";
      return true;
    },
  });

  const addressRegister = register("walletAddress", {
    required: "Wallet address is required",
    minLength: {
      value: 10,
      message: "Address is too short",
    },
    pattern: {
      value: /^mtst1[a-z0-9_]+$/i,
      message: "Address must start with 'mtst1' and contain only letters, numbers, and underscores",
    },
    validate: () => {
      if (!selectedGroup) return true;
      if (addressDuplicate?.isDuplicate) return "This address already exists in the selected group";
      return true;
    },
  });

  const emailRegister = register("email", {
    required: "Email is required",
    pattern: {
      // User-provided RFC-like email regex (escaped '/' for JS regex literal)
      value:
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      message: "Email must be a valid email address",
    },
    maxLength: {
      value: 255,
      message: "Email cannot be longer than 255 characters",
    },
  });

  const handleNext = async () => {
    const step1Fields: (keyof CreateContactFormData)[] = ["name", "email"];
    if (paymentType === "crypto") {
      step1Fields.push("walletAddress");
    }
    step1Fields.push("groupId");

    const valid = await trigger(step1Fields);
    if (!valid) return;

    if (!selectedGroup) {
      toast.error("Please select a group");
      return;
    }

    if (paymentType === "crypto") {
      if (!selectedToken) { toast.error("Please select a token"); return; }
      if (!selectedNetwork) { toast.error("Please select a network"); return; }
    } else {
      if (!fiatData.countryCode) { toast.error("Please select a country"); return; }
    }

    setStep(2);
  };

  const onSubmit = async (data: CreateContactFormData) => {
    if (!selectedGroup) {
      toast.error("Please select a group");
      return;
    }

    try {
      const tokenPayload: TokenDto | undefined = paymentType === "crypto" && selectedToken
        ? {
            address: selectedToken.faucetId,
            symbol: selectedToken.metadata.symbol,
            decimals: selectedToken.metadata.decimals,
            name: selectedToken.metadata.symbol,
          }
        : undefined;

      const networkPayload: NetworkDto | undefined = paymentType === "crypto" && selectedNetwork
        ? { name: selectedNetwork.name, chainId: networkChainIds[selectedNetwork.value] ?? 0 }
        : undefined;

      const employeePayload: any = {
        groupId: selectedGroup.id,
        name: data.name.trim(),
        walletAddress: paymentType === "crypto" ? data.walletAddress.trim() : "",
        email: data.email?.trim() || undefined,
        token: tokenPayload || null,
        network: networkPayload || null,
        employeeType: "employee",
        isActive: true,
        paymentMethod: paymentType,
        fiatDetails: paymentType === "fiat" ? {
          country: fiatData.country,
          bank: fiatData.bankName,
          currency: fiatData.currency,
        } : undefined,
        payroll: {
          duration: data.duration,
          durationUnit: data.durationUnit,
          monthlyAmount: data.monthlyAmount,
          paydayDay: selectedPayDay,
          description: data.description,
          note: data.note,
        },
      };

      const result = await createEmployee.mutateAsync(employeePayload);

      toast.success("Employee created successfully");

      reset();
      setStep(1);
      setSelectedToken(DEFAULT_TOKEN);
      setSelectedNetwork(DEFAULT_NETWORK);
      setSelectedGroup(undefined);
      setSelectedPayDay(28);
      onClose();
      closeModal("CHOOSE_CONTACT_TYPE");

      // Navigate to employee detail to set up payroll
      if (result?.id) {
        router.push(`/contact-book/employee/${result.id}`);
      }
    } catch (error) {
      console.error("Failed to create contact:", error);
      toast.error("Failed to create contact");
    }
  };

  const handleTokenSelect = (token: AssetWithMetadata | null) => {
    setSelectedToken(token);
  };

  const handleGroupSelect = (group: CompanyGroupResponseDto) => {
    setSelectedGroup(group);
    setValue("groupId", group.id, { shouldValidate: true, shouldTouch: true });
  };

  const handleCancel = () => {
    reset();
    setStep(1);
    setSelectedToken(DEFAULT_TOKEN);
    setSelectedNetwork(DEFAULT_NETWORK);
    setSelectedGroup(undefined);
    setSelectedPayDay(28);
    onClose();
  };

  const [durationUnit, setDurationUnit] = useState<"month" | "year">("month");
  const handleToggleDurationUnit = () => {
    const newUnit = durationUnit === "month" ? "year" : "month";
    setDurationUnit(newUnit);
    setValue("durationUnit", newUnit, { shouldValidate: true });
  };

  const handleNextToReview = async () => {
    const valid = await trigger(["duration", "monthlyAmount", "description"]);
    if (!valid) return;
    setStep(3);
  };

  const buildInvoiceData = () => {
    const formValues = watch();
    const tokenSymbol = selectedToken ? n(selectedToken.metadata.symbol) : "USDT";
    const networkName = selectedNetwork?.name || "Miden Testnet";

    const payStart = new Date();
    payStart.setDate(selectedPayDay);
    payStart.setMonth(payStart.getMonth() + 1);
    const dueDate = payStart.toISOString().split("T")[0];
    const invoiceDate = new Date(payStart);
    invoiceDate.setDate(payStart.getDate() - 5);

    const amount = Number(formValues.monthlyAmount) || 0;

    return {
      invoiceNumber: "INV0001",
      date: invoiceDate.toISOString().split("T")[0],
      dueDate,
      note: formValues.note || undefined,
      from: {
        name: formValues.name,
        email: formValues.email,
        company: "",
        address: "",
        network: networkName,
        token: tokenSymbol,
        walletAddress: formValues.walletAddress || "",
      },
      billTo: {
        name: company?.companyName || "",
        email: user?.email || "",
        company: company?.companyName || "",
        address: "",
      },
      items: [
        {
          description: formValues.description || "Payroll Payment",
          price: amount,
          qty: 1,
          amount,
        },
      ],
      subtotal: amount,
      total: amount,
      currency: tokenSymbol,
    };
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} zIndex={zIndex}>
      <div className={step === 3 ? "w-[1100px]" : "w-[620px]"} style={{ transition: "width 0.3s ease" }}>
      <ModalHeader
        title={step === 1 ? "Add new contact" : step === 2 ? "Set up payroll" : "Review invoice"}
        icon={step === 1 ? "/misc/blue-user-hexagon-icon.svg" : "/sidebar/payroll.svg"}
        onClose={onClose}
      />
      <div className="bg-background border-2 border-primary-divider rounded-b-2xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary-blue" : "text-text-secondary"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-primary-blue text-white" : "bg-primary-blue/10 text-primary-blue"}`}>1</div>
              <span className="text-sm font-medium">Contact</span>
            </div>
            <div className="flex-1 h-px bg-primary-divider" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary-blue" : "text-text-secondary"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-primary-blue text-white" : step > 2 ? "bg-primary-blue/10 text-primary-blue" : "bg-primary-divider text-text-secondary"}`}>2</div>
              <span className="text-sm font-medium">Payroll</span>
            </div>
            <div className="flex-1 h-px bg-primary-divider" />
            <div className={`flex items-center gap-1.5 ${step === 3 ? "text-primary-blue" : "text-text-secondary"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? "bg-primary-blue text-white" : "bg-primary-divider text-text-secondary"}`}>3</div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>

          {step === 1 ? (
            <>
              <FormInput
                label="Name"
                placeholder="Enter contact name"
                register={nameRegister}
                error={visibleErrors.name?.message}
                disabled={createEmployee.isPending}
                required
              />

              <FormInput
                label="Email"
                placeholder="Enter email"
                type="email"
                register={emailRegister}
                error={visibleErrors.email?.message}
                disabled={createEmployee.isPending}
                required
              />

              {/* Payment Type Toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium px-1">Payment method</label>
                <div className="flex rounded-xl bg-app-background p-1 border border-primary-divider">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      paymentType === "crypto"
                        ? "bg-background text-text-primary shadow-sm border border-primary-divider"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    onClick={() => setPaymentType("crypto")}
                  >
                    Crypto
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      paymentType === "fiat"
                        ? "bg-background text-text-primary shadow-sm border border-primary-divider"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    onClick={() => setPaymentType("fiat")}
                  >
                    Fiat Payout
                  </button>
                </div>
                {paymentType === "fiat" && (
                  <p className="text-xs text-text-secondary px-1">Pay from your stablecoin balance. Our licensed partner handles fiat conversion and bank transfer.</p>
                )}
              </div>

              {paymentType === "crypto" ? (
                <>
                  <FormInput
                    label="Wallet address"
                    placeholder="Enter wallet address"
                    register={addressRegister}
                    error={visibleErrors.walletAddress?.message}
                    disabled={createEmployee.isPending}
                    required
                  />

                  <input type="hidden" {...groupIdRegister} value={selectedGroup?.id ?? ""} />

                  {/* Network Selection */}
                  <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
                    <button
                      type="button"
                      onClick={() => openModal(MODAL_IDS.SELECT_NETWORK, { onNetworkSelect: setSelectedNetwork })}
                      className="flex items-center gap-2 px-4 py-2 h-full w-full text-left cursor-pointer"
                      disabled={createEmployee.isPending}
                    >
                      {selectedNetwork && <img src={selectedNetwork.icon} alt="network" className="w-8 h-8" />}
                      <div className="flex-1">
                        <p className="text-text-secondary text-sm leading-none">Select network</p>
                        <p className="text-text-primary text-base font-medium">{selectedNetwork?.name || "-"}</p>
                      </div>
                      <img src="/arrow/chevron-down.svg" alt="dropdown" className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Token Selection */}
                  <div className="bg-app-background rounded-xl border-b-2 border-primary-divider">
                    <button
                      type="button"
                      onClick={() => openModal(MODAL_IDS.SELECT_TOKEN, { onTokenSelect: handleTokenSelect })}
                      className="flex items-center gap-2 px-4 py-2 h-full w-full text-left cursor-pointer"
                      disabled={createEmployee.isPending}
                    >
                      {selectedToken && (
                        <img
                          src={
                            selectedToken.metadata.symbol === "USDT"
                              ? "/token/usdt.svg"
                              : blo(turnBechToHex(selectedToken.faucetId))
                          }
                          alt="token"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-text-secondary text-sm leading-none">Select token</p>
                        <p className="text-text-primary text-base font-medium">{selectedToken?.metadata.symbol || "-"}</p>
                      </div>
                      <img src="/arrow/chevron-down.svg" alt="dropdown" className="w-6 h-6" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input type="hidden" {...groupIdRegister} value={selectedGroup?.id ?? ""} />

                  <FiatPayoutFields
                    data={fiatData}
                    onChange={setFiatData}
                    disabled={createEmployee.isPending}
                  />
                </>
              )}

              {/* Category Selection */}
              <div className="bg-app-background rounded-xl border-b-2 border-primary-divider py-2">
                <EmployeeGroupDropdown
                  groups={employeeGroups}
                  selectedGroup={selectedGroup}
                  onGroupSelect={handleGroupSelect}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-3">
                <SecondaryButton
                  text="Cancel"
                  onClick={handleCancel}
                  buttonClassName="flex-1"
                  disabled={createEmployee.isPending}
                  variant="light"
                />
                <PrimaryButton
                  text="Next"
                  onClick={handleNext}
                  containerClassName="flex-1"
                  disabled={!selectedGroup || !isValid}
                />
              </div>
            </>
          ) : step === 2 ? (
            <>
              {/* Step 2: Payroll Setup */}
              {/* Duration */}
              <div className="flex flex-col gap-2">
                <div className="bg-app-background rounded-xl p-3 border-b-2 border-primary-divider flex items-center justify-between">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <p className="text-text-secondary text-sm">Duration</p>
                    <input
                      {...register("duration", { required: "Duration is required" })}
                      type="text"
                      autoComplete="off"
                      placeholder="Enter contract duration"
                      className="outline-none bg-transparent text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleDurationUnit}
                    className="bg-background flex items-center justify-center rounded-lg w-fit cursor-pointer border border-primary-divider px-4 py-2 gap-2 shadow-lg"
                  >
                    <span className="leading-none">{durationUnit}</span>
                    <img src="/arrow/chevron-up-down.svg" alt="toggle" className="w-4" />
                  </button>
                </div>
                <input type="hidden" {...register("durationUnit")} />
                {errors.duration && (
                  <div className="flex items-center gap-1 pl-2">
                    <img src="/misc/red-circle-warning.svg" alt="warning" className="w-4 h-4" />
                    <span className="text-[#E93544] text-sm">{errors.duration?.message}</span>
                  </div>
                )}
              </div>

              {/* Monthly Amount */}
              <div className="flex flex-col gap-2">
                <div className="bg-app-background rounded-xl border-b-2 border-primary-divider flex items-center justify-between">
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <label className="text-text-secondary text-sm font-medium">Amount (Monthly)</label>
                    <input
                      {...register("monthlyAmount", {
                        required: "Amount is required",
                        pattern: {
                          value: /^\d+(\.\d+)?$/,
                          message: "Amount must be a valid positive number",
                        },
                      })}
                      type="text"
                      placeholder="Enter amount"
                      className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                      autoComplete="off"
                    />
                  </div>
                  <span className="text-text-primary pr-4">{selectedToken ? selectedToken.metadata.symbol : ""}</span>
                </div>
                {errors.monthlyAmount && (
                  <div className="flex items-center gap-1 pl-2">
                    <img src="/misc/red-circle-warning.svg" alt="warning" className="w-4 h-4" />
                    <span className="text-[#E93544] text-sm">{errors.monthlyAmount?.message}</span>
                  </div>
                )}
              </div>

              {/* Pay Day Calendar */}
              <div className="flex flex-col gap-2">
                <p className="text-text-primary text-base font-medium">Scheduled pay date</p>
                <div className="bg-app-background border border-primary-divider rounded-2xl p-3">
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedPayDay(day)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm cursor-pointer ${
                          selectedPayDay === day ? "bg-primary-blue text-white" : "text-text-secondary hover:bg-gray-100"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <FormInput
                label="Item description"
                placeholder="Add a description"
                register={register("description", { required: "Description is required" })}
                error={errors.description?.message}
                disabled={createEmployee.isPending}
                required
              />

              {/* Note */}
              <FormInput
                label="Note"
                placeholder="Add a note"
                register={register("note")}
                error={errors.note?.message}
                disabled={createEmployee.isPending}
              />

              {/* Action Buttons */}
              <div className="flex flex-row gap-3">
                <SecondaryButton
                  text="Back"
                  onClick={() => setStep(1)}
                  buttonClassName="flex-1"
                  disabled={createEmployee.isPending}
                  variant="light"
                />
                <PrimaryButton
                  text="Next"
                  onClick={handleNextToReview}
                  containerClassName="flex-1"
                />
              </div>
            </>
          ) : (
            <>
              {/* Step 3: Invoice Preview */}
              <div className="flex flex-row gap-6 w-full min-h-[500px]">
                {/* Left: description and actions */}
                <div className="flex flex-col items-center justify-center flex-1 gap-6 py-8">
                  <div className="flex flex-col items-center gap-3">
                    <img src="/misc/blue-review-invoice-icon.svg" alt="review" className="w-12 h-12" />
                    <p className="font-medium text-xl text-text-primary text-center max-w-[300px]">
                      Review & Confirm Monthly Invoice from {watch("name")}
                    </p>
                  </div>
                  <p className="text-text-secondary text-sm text-center max-w-[320px]">
                    Preview the invoice that will be generated for your employee. Make sure all payment details are accurate before confirming.
                  </p>
                  <div className="flex gap-3">
                    <SecondaryButton
                      text="Back"
                      onClick={() => setStep(2)}
                      variant="light"
                      buttonClassName="px-8"
                      disabled={createEmployee.isPending}
                    />
                    <PrimaryButton
                      text="Create"
                      onClick={handleSubmit(onSubmit)}
                      buttonClassName="px-8"
                      loading={createEmployee.isPending}
                    />
                  </div>
                </div>
                {/* Right: invoice preview (scaled to fit) */}
                <div className="w-[500px] h-[560px] overflow-hidden rounded-xl flex-shrink-0">
                  <div className="origin-top-left scale-[0.52]" style={{ width: "960px" }}>
                    <InvoicePreview {...buildInvoiceData() as any} />
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
      </div>
    </BaseModal>
  );
}

export default CreateEmployeeContactModal;
