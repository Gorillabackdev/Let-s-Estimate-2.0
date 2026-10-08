/**
 * Let's Estimate - Client-side Specialized PDF Exporter Utility
 * Downloads genuine official PDF reports for:
 * 1. Cash Flow & S-Curve
 * 2. Tender & Bidder Comparison Matrix
 * 3. Risk & FIDIC 70 Fluctuation Audit
 * 4. Final Account & Contract Closeout Statement
 * 5. Executive Cost Dossier
 * 6. Interim Payment Certificate (IPC)
 */

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export async function exportCashFlowPdf(data: any): Promise<void> {
  const safeName = (data.projectName || 'CashFlow').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_CashFlow_SCurve.pdf`;

  const res = await fetch('/api/export/cash-flow-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate Cash Flow PDF.');
  }

  const blob = await res.blob();
  downloadBlob(new Blob([blob], { type: 'application/pdf' }), filename);
}

export async function exportTenderComparisonPdf(data: any): Promise<void> {
  const safeName = (data.projectName || 'TenderEvaluation').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Tender_Comparison.pdf`;

  const res = await fetch('/api/export/tender-comparison-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate Tender Comparison PDF.');
  }

  const blob = await res.blob();
  downloadBlob(new Blob([blob], { type: 'application/pdf' }), filename);
}

export async function exportRiskAuditPdf(data: any): Promise<void> {
  const safeName = (data.projectName || 'RiskAudit').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Risk_Contingency_Audit.pdf`;

  const res = await fetch('/api/export/risk-audit-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate Cost Risk & Fluctuation Audit PDF.');
  }

  const blob = await res.blob();
  downloadBlob(new Blob([blob], { type: 'application/pdf' }), filename);
}

export async function exportFinalAccountPdf(data: any): Promise<void> {
  const safeName = (data.projectName || 'FinalAccount').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Final_Account_Closeout.pdf`;

  const res = await fetch('/api/export/final-account-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate Final Account PDF.');
  }

  const blob = await res.blob();
  downloadBlob(new Blob([blob], { type: 'application/pdf' }), filename);
}

export async function exportExecutiveDossierPdf(data: any): Promise<void> {
  const safeName = (data.projectName || 'ExecutiveDossier').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Executive_Cost_Dossier.pdf`;

  const res = await fetch('/api/export/executive-dossier-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate Executive Cost Dossier PDF.');
  }

  const blob = await res.blob();
  downloadBlob(new Blob([blob], { type: 'application/pdf' }), filename);
}

export async function exportValuationCertificatePdf(data: any): Promise<void> {
  const safeName = (data.valuationNumber || 'IPC').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Payment_Certificate.pdf`;

  const res = await fetch('/api/export/valuation-certificate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate Valuation Payment Certificate PDF.');
  }

  const blob = await res.blob();
  downloadBlob(new Blob([blob], { type: 'application/pdf' }), filename);
}
