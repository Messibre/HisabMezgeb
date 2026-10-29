import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share2, FileText, FileSpreadsheet, Loader2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import BottomSheet from './BottomSheet';
import api from '@/lib/axios';
import { extractFilenameFromHeader } from '@/lib/utils';

export type ExportDocType = 'report' | 'statement';
export type ExportDocFormat = 'pdf' | 'docx' | 'csv';
export type ExportDocLang = 'en' | 'am' | 'ti';

export interface ExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ExportDocType;
  reportParams?: {
    from: string;
    to: string;
  };
  customerId?: string;
  customerName?: string;
}

export default function ExportSheet({
  open,
  onOpenChange,
  type,
  reportParams,
  customerId,
  customerName,
}: ExportSheetProps) {
  const { t, i18n } = useTranslation();

  // Normalize initial language to supported subset
  const currentLang: ExportDocLang =
    i18n.language === 'am' || i18n.language === 'ti' ? i18n.language : 'en';

  const [format, setFormat] = useState<ExportDocFormat>('pdf');
  const [lang, setLang] = useState<ExportDocLang>(currentLang);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Feature detection for Web Share API with file support
  const canSystemShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  const title =
    type === 'report'
      ? t('export.exportReportTitle', 'Export Report')
      : t('export.shareStatementTitle', 'Share Customer Statement');

  const executeFetch = async (): Promise<{ blob: Blob; filename: string }> => {
    if (!isOnline) {
      throw new Error('OFFLINE');
    }

    let url: string;
    let fallbackFilename: string;

    if (type === 'report' && reportParams) {
      const { from, to } = reportParams;
      url = `/reports/export?from=${from}&to=${to}&format=${format}&lang=${lang}`;
      fallbackFilename = `hisab-report-${from}_to_${to}.${format}`;
    } else if (type === 'statement' && customerId) {
      url = `/debt-customers/${customerId}/statement?format=${format}&lang=${lang}`;
      const safeName = (customerName || 'customer').replace(/[^\w-]/g, '_');
      fallbackFilename = `statement-${safeName}.${format}`;
    } else {
      throw new Error('Invalid export configuration');
    }

    // Use a longer timeout for server-side PDF and DOCX generation (60s)
    const response = await api.get(url, {
      responseType: 'blob',
      timeout: 60000,
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const filename = extractFilenameFromHeader(disposition, fallbackFilename);
    const blob = response.data as Blob;

    return { blob, filename };
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await executeFetch();

      // Trigger temporary download URL and revoke
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      toast.success(t('export.successToast', 'File downloaded successfully'));
      onOpenChange(false);
    } catch (err: unknown) {
      handleExportError(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const { blob, filename } = await executeFetch();

      // Packaging the app later (e.g. Capacitor, Tauri, or Cordova) may need a native file write or Share plugin.
      const file = new File([blob], filename, {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : format === 'docx'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'text/csv',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        toast.success(t('export.shareSuccessToast', 'Statement shared successfully'));
        onOpenChange(false);
      } else {
        // Fallback to standard download if system cannot share files
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
        toast.success(t('export.successToast', 'File downloaded successfully'));
        onOpenChange(false);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // User cancelled share modal, don't show error
        return;
      }
      handleExportError(err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportError = (err: unknown) => {
    const errorObj = err as {
      message?: string;
      code?: string;
      name?: string;
      response?: {
        status?: number;
        headers?: Record<string, string>;
        data?: { requestId?: string };
      };
    };

    if (errorObj?.message === 'OFFLINE' || !navigator.onLine) {
      toast.error(t('export.offlineError', 'Exporting needs internet connection'));
      return;
    }

    if (errorObj?.code === 'ECONNABORTED' || errorObj?.response?.status === 408) {
      toast.error(t('export.timeoutError', 'Export request timed out. Please try again.'));
      return;
    }

    const requestId =
      errorObj?.response?.headers?.['x-request-id'] ||
      errorObj?.response?.data?.requestId;

    const baseMsg = t('export.serverError', 'Server error exporting document');
    toast.error(requestId ? `${baseMsg} (Ref: ${requestId})` : baseMsg);
  };

  const isLoading = isDownloading || isSharing;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-5 pt-2">
        {/* Offline Warning Banner */}
        {!isOnline && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{t('export.offlineError', 'Exporting needs internet connection')}</span>
          </div>
        )}

        {/* Format Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
            {t('export.format', 'Format')}
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                format === 'pdf'
                  ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary'
                  : 'border-border bg-card text-foreground hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-sm font-semibold">PDF</div>
                  <div className="text-xs text-muted-foreground">
                    {t('export.pdfFormat', 'PDF (Recommended for printing & sharing)')}
                  </div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  format === 'pdf' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {format === 'pdf' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('docx')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                format === 'docx'
                  ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary'
                  : 'border-border bg-card text-foreground hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm font-semibold">Word (.docx)</div>
                  <div className="text-xs text-muted-foreground">
                    {t('export.docxFormat', 'Word (.docx - Editable)')}
                  </div>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  format === 'docx' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {format === 'docx' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>

            {type === 'report' && (
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  format === 'csv'
                    ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-sm font-semibold">CSV</div>
                    <div className="text-xs text-muted-foreground">
                      {t('export.csvFormat', 'CSV (Spreadsheet)')}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    format === 'csv' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                >
                  {format === 'csv' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            )}
          </div>

          {format === 'docx' && (
            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
              <span>
                {t(
                  'export.wordNotice',
                  "Note: Viewing Ge'ez characters in Word requires a Ge'ez font installed.",
                )}
              </span>
            </p>
          )}
        </div>

        {/* Language Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
            {t('export.language', 'Language')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'en', label: 'English' },
                { id: 'am', label: 'አማርኛ' },
                { id: 'ti', label: 'ትግርኛ' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLang(item.id)}
                className={`py-2 px-3 rounded-xl border text-center text-sm font-medium transition-all ${
                  lang === item.id
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {canSystemShare && (
            <button
              type="button"
              disabled={isLoading || !isOnline}
              onClick={handleShare}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('export.sharing', 'Preparing...')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>{t('export.share', 'Share')}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={isLoading || !isOnline}
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('export.downloading', 'Downloading...')}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t('export.download', 'Download')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
