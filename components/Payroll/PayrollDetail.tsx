"use client";
import { n } from "@/services/utils/normalizeToken";
import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { BaseContainer } from "../Common/BaseContainer";
import { Table } from "../Common/Table";
import { TabContainer } from "../Common/TabContainer";
import { Badge, BadgeStatus } from "../Common/Badge";
import { useTitle } from "@/contexts/TitleProvider";
import { useRouter } from "next/navigation";
import { useGetPayrollDetails } from "@/services/api/payroll";
import toast from "react-hot-toast";
import { CategoryBadge } from "../ContactBook/ContactBookContainer";
import { useGetAllEmployeeGroups, useGetEmployeeById, useUpdateEmployee } from "@/services/api/employee";
import { CategoryShapeEnum } from "@qash/types/enums";
import { InvoiceStatusEnum } from "@qash/types/enums";
import { useModal } from "@/contexts/ModalManagerProvider";
import { InvoiceModalProps } from "@/types/modal";
import { useInvoice } from "@/hooks/server/useInvoice";
import { SecondaryButton } from "../Common/SecondaryButton";
import { ToggleSwitch } from "../Common/ToggleSwitch";

const labelStyles = "py-1 text-base font-medium text-text-secondary";

const PayrollDetail = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { setTitle, setShowBackArrow, setOnBackClick } = useTitle();
  const { openModal } = useModal();

  // Support both path param (/employee/[id]) and search param (?id=X)
  const payrollId = parseInt((params?.id as string) || searchParams.get("id") || "0", 10);
  const { data: payrollData, isLoading, error } = useGetPayrollDetails(payrollId);
  const { data: groups } = useGetAllEmployeeGroups();
  const { data: employeeData } = useGetEmployeeById(payrollId);
  const { mutate: updateEmployeeMutate } = useUpdateEmployee();
  const { fetchInvoiceByUUID } = useInvoice();

  const isActive = (employeeData as any)?.isActive !== false;
  const isContractor = (employeeData as any)?.employeeType === "contractor";

  // Compute next payment date and contract months left
  const nextPaymentDate = (() => {
    if (!isActive || !payrollData) return null;
    const now = new Date();
    const payday = payrollData.paydayDay || 28;
    const next = new Date(now.getFullYear(), now.getMonth(), payday);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    const endDate = new Date(payrollData.payEndDate);
    if (next > endDate) return null;
    return next;
  })();

  const contractMonthsLeft = (() => {
    if (!payrollData) return 0;
    const now = new Date();
    const end = new Date(payrollData.payEndDate);
    const diff = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, diff);
  })();

  const handleToggleActive = (newActive?: boolean) => {
    if (!employeeData) return;
    const active = typeof newActive === "boolean" ? newActive : !isActive;
    updateEmployeeMutate((employeeData as any).id, { isActive: active });
    toast.success(active ? "Payment enabled" : "Payment disabled");
  };

  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter invoices based on active tab
  const getFilteredInvoices = () => {
    if (!payrollData?.invoices) return [];

    const invoices = payrollData.invoices;

    switch (activeTab) {
      case "awaiting":
        return invoices.filter(invoice => invoice.status === "SENT");
      case "paid":
        return invoices.filter(invoice => invoice.status === "PAID");
      case "all":
      default:
        return invoices;
    }
  };

  // Handle row click to open invoice modal
  const handleRowClick = async (_: Record<string, any>, index: number) => {
    const invoices = getFilteredInvoices();
    const inv = invoices[index];
    if (!inv || !payrollData) return;

    // Try fetching from API first, fall back to demo data
    let invoice = await fetchInvoiceByUUID(inv.uuid).catch(() => null);

    const company = `${payrollData.company?.companyName || ""} ${payrollData.company?.companyType || ""}`.trim();
    const total = typeof inv.total === "string" ? parseFloat(inv.total) : inv.total || 0;
    const tokenSymbol = n(payrollData.token?.symbol || "USDT");

    openModal<InvoiceModalProps>("INVOICE_MODAL", {
      invoice: {
        invoiceNumber: invoice?.invoiceNumber || inv.invoiceNumber || "",
        from: {
          name: invoice?.fromDetails?.name || inv.fromDetails?.name || payrollData.employee.name || "",
          company: "",
          address: invoice?.fromDetails?.address || "",
          email: invoice?.fromDetails?.email || inv.fromDetails?.email || payrollData.employee.email || "",
        },
        billTo: {
          name: company,
          company: company,
          address: invoice ? [
            invoice.toDetails?.address1,
            invoice.toDetails?.address2,
            invoice.toDetails?.city,
            invoice.toDetails?.country,
          ].filter(Boolean).join(", ") : "",
          email: invoice?.toDetails?.email || "",
        },
        date: invoice?.createdAt || inv.createdAt,
        dueDate: invoice?.dueDate || inv.dueDate || "",
        network: payrollData.network?.name || "",
        paymentToken: payrollData.token,
        currency: invoice?.currency || inv.currency || tokenSymbol,
        items: invoice?.items
          ? invoice.items.map((item: any) => ({
              name: item?.description || "",
              rate: item?.unitPrice || 0,
              qty: item?.quantity || 0,
              amount: item?.total || 0,
            }))
          : [{ name: `Monthly salary - ${new Date(inv.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, rate: total, qty: 1, amount: total }],
        subtotal: total,
        tax: 0,
        total,
        walletAddress: payrollData.employee.walletAddress || "",
        amountDue: total.toString(),
      },
    });
  };

  const isEmployeeRoute = typeof params?.id === "string";

  useEffect(() => {
    if (payrollData?.employee) {
      setTitle(
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{isEmployeeRoute ? "Employee /" : "Payroll /"}</span>
          <span className="text-text-primary">{payrollData.employee.name}{isEmployeeRoute ? "" : "'s payroll"}</span>
        </div>,
      );
    }
    setShowBackArrow(true);
    setOnBackClick(() => () => router.back());

    return () => {
      setOnBackClick(undefined);
      setShowBackArrow(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollData?.employee?.name, isEmployeeRoute]);

  if (isLoading) {
    return (
      <div className="p-5 flex flex-col items-center justify-center w-full h-full">
        <div role="status">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-neutral-tertiary animate-spin fill-brand"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !payrollData) {
    return (
      <div className="p-5 flex flex-col items-center justify-center w-full h-full">
        <p className="text-red-500">Failed to load payroll details</p>
      </div>
    );
  }

  // Transform invoices to table data format
  const paymentHistoryData = getFilteredInvoices().map(invoice => ({
    "Creation date": new Date(invoice.createdAt).toLocaleDateString(),
    Invoice: `${invoice.invoiceNumber}`,
    Name: invoice.fromDetails?.name || payrollData.employee.name,
    Amount: (
      <div className="flex items-center gap-2 justify-center">
        <span>{invoice.total}</span>
        <img
          alt={n(invoice.paymentToken?.symbol)}
          className="w-4"
          src={`/token/${n(invoice.paymentToken?.symbol).toLowerCase()}.svg`}
        />
      </div>
    ),
    "Due Date": new Date(invoice.dueDate ?? "").toLocaleDateString(),
    Status: (
      <div className="w-full flex justify-center items-center">
        <Badge
          text={invoice.status}
          status={
            invoice?.status === InvoiceStatusEnum?.CANCELLED
              ? BadgeStatus.FAIL
              : invoice?.status === InvoiceStatusEnum.PAID
                ? BadgeStatus.SUCCESS
                : BadgeStatus.AWAITING
          }
          className="px-5"
        />
      </div>
    ),
  }));

  const renderHeader = () => {
    switch (activeTab) {
      case "all":
        return (
          <div className="flex flex-col gap-2">
            <span className="text-text-primary text-2xl font-medium leading-none">Overview</span>
            <span className="text-text-secondary text-[14px] font-medium leading-none">
              Manage all the invoices you received from vendors
            </span>
          </div>
        );
      case "awaiting":
        return (
          <div className="flex flex-col gap-2">
            <span className="text-text-primary text-2xl font-medium leading-none">Pending bills</span>
            <span className="text-text-secondary text-[14px] font-medium leading-none">
              Waiting for vendor to review and confirm their invoices.
            </span>
          </div>
        );
      case "paid":
        return (
          <div className="flex flex-col gap-2">
            <span className="text-text-primary text-2xl font-medium leading-none">Paid bills</span>
            <span className="text-text-secondary text-[14px] font-medium leading-none">
              All bills that have been fully paid.
            </span>
          </div>
        );
      default:
        return "Payments";
    }
  };

  return (
    <div className="p-5 flex flex-col items-start justify-start w-full h-full gap-4">
      {/* Header with name, badges, and toggle */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue text-lg font-bold">
            {payrollData.employee.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl text-text-primary">{payrollData.employee.name}</span>
              {isContractor && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E97135]/10 text-[#E97135]">Contractor</span>
              )}
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isActive ? "bg-[#1DAF61]/10 text-[#1DAF61]" : "bg-[#E93544]/10 text-[#E93544]"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#1DAF61]" : "bg-[#E93544]"}`} />
                {isActive ? "Active" : "Disabled"}
              </span>
            </div>
            <span className="text-text-secondary text-sm">{payrollData.employee.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton
            text="Edit Payroll"
            onClick={() => router.push(`/payroll/edit?id=${payrollId}`)}
            variant="light"
            buttonClassName="px-5"
          />
          <SecondaryButton
            text={isActive ? "Disable Payment" : "Enable Payment"}
            onClick={() => handleToggleActive()}
            variant={isActive ? "red" : "dark"}
            buttonClassName="px-5"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="flex gap-3 items-stretch w-full">
        {/* Next Payment */}
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Next Payment</span>
          {isActive && nextPaymentDate ? (
            <span className="text-text-primary text-xl font-bold">
              {nextPaymentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          ) : (
            <span className="text-text-secondary text-xl font-bold">None</span>
          )}
          <span className="text-text-secondary text-xs">{payrollData.paydayDay}th every month</span>
        </div>

        {/* Monthly Amount */}
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Monthly Amount</span>
          <div className="flex items-center gap-2">
            <img
              alt={n(payrollData.token.symbol)}
              className="w-5 h-5"
              src={`/token/${n(payrollData.token.symbol).toLowerCase()}.svg`}
            />
            <span className="text-text-primary text-xl font-bold">
              {payrollData.amount?.toLocaleString()} {n(payrollData.token.symbol)}
            </span>
          </div>
        </div>

        {/* Contract Left */}
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Contract Remaining</span>
          <span className="text-text-primary text-xl font-bold">{contractMonthsLeft} months</span>
          <span className="text-text-secondary text-xs">
            Until {new Date(payrollData.payEndDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Group */}
        <div className="flex-1 border border-primary-divider rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-text-secondary text-sm">Group</span>
          <div className="mt-1">
            <CategoryBadge
              shape={groups?.find((cat: any) => cat.id === payrollData?.employee?.groupId)?.shape || CategoryShapeEnum.CIRCLE}
              color={groups?.find((cat: any) => cat.id === payrollData?.employee?.groupId)?.color || "#35ADE9"}
              name={groups?.find((cat: any) => cat.id === payrollData?.employee?.groupId)?.name || "-"}
            />
          </div>
        </div>
      </div>

      {/* Employee & Payment Details */}
      <div className="flex gap-3 items-start w-full">
        {/* Employee Information */}
        <div className="flex-1 border border-primary-divider rounded-2xl px-4 py-3 flex gap-3 items-center">
          <div className="flex flex-col gap-1 w-[99px]">
            <div className={labelStyles}>Network</div>
            <div className={labelStyles}>Token</div>
            <div className={labelStyles}>Address</div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="py-1 flex items-center gap-2">
              <img
                className="w-5"
                alt={payrollData.network?.name || ""}
                src={`/chain/${(payrollData.network?.name || "miden-testnet").toLowerCase().replace(" ", "-")}.svg`}
              />
              <span className="text-base font-medium text-text-primary">{payrollData.network?.name || "-"}</span>
            </div>
            <div className="py-1 flex items-center gap-2">
              <img
                alt={n(payrollData.token.symbol)}
                className="w-5 h-5"
                src={`/token/${n(payrollData.token.symbol).toLowerCase()}.svg`}
              />
              <span className="text-base font-medium text-text-primary">{n(payrollData.token.symbol)}</span>
            </div>
            <div className="py-1 flex items-center gap-2 justify-start">
              <span className="text-base font-medium text-text-primary">{payrollData.employee.walletAddress || "-"}</span>
              {payrollData.employee.walletAddress && (
                <img
                  alt="Copy"
                  className="w-5 h-5 cursor-pointer"
                  src="/misc/copy-icon.svg"
                  onClick={async () => {
                    await navigator.clipboard.writeText(payrollData.employee.walletAddress);
                    toast.success("Address copied to clipboard");
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Contract Information */}
        <div className="flex-1 border border-primary-divider rounded-2xl px-4 py-3 flex gap-3 items-center">
          <div className="flex flex-col gap-1 w-[99px]">
            <div className={labelStyles}>Created on</div>
            <div className={labelStyles}>Contract</div>
            <div className={labelStyles}>Payday</div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="py-1 text-base font-medium text-text-primary">
              {new Date(payrollData.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="py-1 text-base font-medium text-text-primary">
              {new Date(payrollData.joiningDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} - {new Date(payrollData.payEndDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </div>
            <div className="py-1 text-base font-medium text-text-primary">{payrollData.paydayDay}th every month</div>
          </div>
        </div>
      </div>

      <BaseContainer
        header={
          <div className="flex w-full justify-between items-center py-3 px-5">
            <div className="flex flex-col gap-1">
              <TabContainer
                tabs={[
                  { id: "all", label: "All" },
                  { id: "awaiting", label: "Awaiting" },
                  { id: "paid", label: "Paid" },
                ]}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>
        }
        childrenClassName="p-5 gap-5"
        containerClassName="w-full h-full bg-[#F6F6F6]"
      >
        <div className="flex w-full justify-between items-center">
          {renderHeader()}

          {/* Filter Button */}
          <div className="flex items-center gap-2">
            {/* TODO: IMPLEMENT SORT AND FILTER */}
            {/* <SecondaryButton
              text="Sort"
              icon="/misc/sort-icon.svg"
              onClick={() => console.log("Sort button clicked")}
              iconPosition="left"
              variant="light"
              buttonClassName="px-2"
            />
            <SecondaryButton
              text="Filter"
              icon="/wallet-analytics/setting-icon.gif"
              onClick={() => console.log("Filter button clicked")}
              iconPosition="left"
              variant="light"
              buttonClassName="px-2"
            /> */}
          </div>
        </div>
        <Table
          headers={["Creation date", "Invoice", "Name", "Amount", "Due Date", "Status"]}
          data={paymentHistoryData}
          className="w-full"
          rowClassName="py-5"
          headerClassName="py-3"
          showPagination={true}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowClick={handleRowClick}
        />
      </BaseContainer>
    </div>
  );
};

export default PayrollDetail;
