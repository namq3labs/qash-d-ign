// Demo mode: mock invoice API

// Async function stubs
export const getInvoices = async (_query?: any) => ({ invoices: [], pagination: {} });
export const getInvoiceStats = async () => ({});
export const getInvoiceByUUID = async (_uuid: string) => {
  // In demo mode, bill UUIDs are passed as invoiceUUID params.
  // Look up the bill from demo data and return it in the invoice shape.
  try {
    if (typeof window === "undefined") return null;
    const stored = JSON.parse(localStorage.getItem("qash_demo_state") || "{}");
    const bill = (stored.bills ?? []).find((b: any) => b.uuid === _uuid);
    if (!bill) return null;
    return {
      uuid: bill.uuid,
      invoiceNumber: `BILL-${bill.id}`,
      fromDetails: { name: bill.vendor, companyName: bill.vendor },
      toDetails: {
        companyName: stored.company?.companyName || "",
        email: stored.user?.email || "",
        address1: "",
        address2: "",
        city: "",
        country: stored.company?.country || "",
      },
      toCompany: {
        companyName: stored.company?.companyName || "",
        companyType: stored.company?.industry || "",
      },
      total: bill.amount,
      subtotal: bill.amount,
      totalUsd: bill.amount,
      paymentToken: { name: "USDT", symbol: "USDT" },
      currency: bill.currency || "USDC",
      status: bill.status,
      issueDate: bill.createdAt,
      dueDate: bill.dueDate,
      paymentWalletAddress: stored.accounts?.[0]?.accountId || "",
      items: [
        {
          description: bill.description,
          quantity: 1,
          unitPrice: bill.amount,
          total: bill.amount,
        },
      ],
      employee: null,
    };
  } catch {
    return null;
  }
};
export const downloadInvoicePdf = async (_uuid: string) => new Blob();
export const createPayrollInvoice = async (_data: any) => ({});
export const generateInvoice = async (_payrollId: number) => ({});
export const updateInvoice = async (_uuid: string, _data: any) => ({});
export const sendInvoice = async (_uuid: string) => ({});
export const reviewInvoice = async (_uuid: string) => ({});
export const confirmInvoice = async (_uuid: string) => ({});
export const cancelInvoice = async (_uuid: string) => ({});

// B2B Invoice stubs
export const getB2BInvoices = async (_query?: any) => {
  try {
    if (typeof window === "undefined") return { invoices: [], pagination: {} };
    const stored = JSON.parse(window.localStorage.getItem("qash_demo_invoices") || "{}");
    const invoices = Object.values(stored).map((inv: any) => ({
      ...inv,
      invoiceNumber: inv.invoiceNumber || "INV-0000",
      status: inv.status || "SENT",
      total: inv.total || 0,
      currency: inv.currency || "USD",
      createdAt: inv.issueDate || new Date().toISOString(),
      toCompanyName: inv.toDetails?.companyName || inv.toCompanyName || "",
      toCompanyEmail: inv.toDetails?.email || inv.toCompanyEmail || "",
      paymentToken: inv.paymentToken || { name: "USDT" },
    }));
    return { invoices, pagination: { total: invoices.length, page: 1, limit: 100, totalPages: 1 } };
  } catch {
    return { invoices: [], pagination: {} };
  }
};
export const getB2BInvoiceStats = async () => {
  try {
    if (typeof window === "undefined") return { total: 0, sent: 0, paid: 0, totalAmount: 0 };
    const stored = JSON.parse(window.localStorage.getItem("qash_demo_invoices") || "{}");
    const invoices = Object.values(stored) as any[];
    const sent = invoices.filter(i => i.status === "SENT").length;
    const paid = invoices.filter(i => i.status === "PAID").length;
    const totalAmount = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    return { total: invoices.length, sent, paid, totalAmount };
  } catch {
    return { total: 0, sent: 0, paid: 0, totalAmount: 0 };
  }
};
export const getB2BInvoiceByUUID = async (_uuid: string) => {
  try {
    if (typeof window === "undefined") return null;
    const stored = JSON.parse(window.localStorage.getItem("qash_demo_invoices") || "{}");
    return stored[_uuid] || null;
  } catch {
    return null;
  }
};
export const getB2BInvoiceByUUIDPublic = async (_uuid: string) => {
  try {
    if (typeof window === "undefined") return null;
    const stored = JSON.parse(window.localStorage.getItem("qash_demo_invoices") || "{}");
    return stored[_uuid] || null;
  } catch {
    return null;
  }
};
export const downloadB2BInvoicePdf = async (_uuid: string) => new Blob();
export const createB2BInvoice = async (_data: any) => ({
  uuid: `inv-${Date.now()}`,
  invoiceNumber: _data?.fromDetails?.invoiceNumber || `INV-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
  status: "DRAFT",
  total: _data?.items?.reduce((sum: number, i: any) => sum + (parseFloat(i.total) || 0), 0) || 0,
  subtotal: _data?.items?.reduce((sum: number, i: any) => sum + (parseFloat(i.total) || 0), 0) || 0,
  issueDate: _data?.issueDate || new Date().toISOString(),
  dueDate: _data?.dueDate || "",
  walletAddress: _data?.walletAddress || "",
  paymentWalletAddress: _data?.walletAddress || "",
  paymentNetwork: _data?.network || { name: "Miden" },
  fromDetails: _data?.fromDetails || {},
});
export const updateB2BInvoice = async (_uuid: string, _data: any) => ({});
export const sendB2BInvoice = async (_uuid: string) => ({});
export const confirmB2BInvoice = async (_uuid: string) => ({});
export const markB2BInvoiceAsPaid = async (_uuid: string) => ({});
export const cancelB2BInvoice = async (_uuid: string) => ({});
export const deleteB2BInvoice = async (_uuid: string) => ({});

// B2B Schedule stubs
export const getB2BSchedules = async () => ({ schedules: [], pagination: {} });
export const getB2BScheduleByUUID = async (_uuid: string) => null;
export const createB2BSchedule = async (_data: any) => ({});
export const updateB2BSchedule = async (_uuid: string, _data: any) => ({});
export const toggleB2BSchedule = async (_uuid: string) => ({});
export const deleteB2BSchedule = async (_uuid: string) => ({});
