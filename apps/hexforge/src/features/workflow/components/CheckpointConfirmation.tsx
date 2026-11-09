import type { Project } from '@/api/projectTypes';
import { Button } from '@/shared/ui/Button';
import { Archive, CheckCircle, Copy } from 'lucide-react';
import gmailIcon from '@/shared/assets/icons/gmail.svg';
import { QuoteCostSummary } from '@/features/workflow/components/QuoteCostSummary';
import { GmailReplyComposer } from '@/features/gmail/components/GmailReplyComposer';
import { useQuoteConfirmation } from '../hooks/useQuoteConfirmation';

export function CheckpointConfirmation(props: { project: Project; onAdvanceToProduction?: () => void }) {
  const { project } = props;
  const {
    updateProject,
    isOpeningGmail,
    pendingAction,
    quoteComparison,
    quoteActionMode,
    quoteActionButtonLabel,
    currentIssuedSnapshot,
    currentIssuedVersion,
    selectedQuoteViewId,
    setSelectedQuoteViewId,
    quoteViews,
    selectedQuoteView,
    showQuoteViewSelect,
    quoteIsIssued,
    unverifiedParts,
    handleIssueQuote,
    handleMoveToPrinting,
    handleArchive,
    downloadQuotePdf,
    replyEmail,
    displayedEmailContent,
    copyToClipboard,
    getQuotePdfAttachment,
    sendEmail,
    quoteStatusTitle,
    quoteStatusBody,
    quoteStatusTotal,
    productionReadinessBody,
  } = useQuoteConfirmation(props);
  return (
    <div className="w-full space-y-6">
      <QuoteCostSummary
        quoteViews={quoteViews}
        selectedQuoteView={selectedQuoteView}
        selectedQuoteViewId={selectedQuoteViewId}
        setSelectedQuoteViewId={setSelectedQuoteViewId}
        showQuoteViewSelect={showQuoteViewSelect}
        quoteIsIssued={quoteIsIssued}
        quoteStatus={quoteComparison.status}
        currentIssuedVersion={currentIssuedVersion}
        downloadQuotePdf={downloadQuotePdf}
      />

      <section className="forge-panel p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
              Payment Management
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-slate-100">
              Quote, receipt and payment controls
            </h3>
          </div>
          <Button
            className="gap-2"
            variant="outline"
            onClick={handleIssueQuote}
            disabled={
              project.parts.length === 0 ||
              unverifiedParts.length > 0 ||
              quoteComparison.status === 'up_to_date' ||
              pendingAction !== null
            }
            loading={pendingAction === 'quote'}
            loadingText={quoteActionMode === 'initial' ? 'Creating Quote…' : 'Updating Quote…'}
            title={
              quoteComparison.status === 'outdated'
                ? 'Supersede the current issued quote with updated draft values.'
                : undefined
            }
          >
            <CheckCircle className="w-5 h-5" /> {quoteActionButtonLabel}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="space-y-4">
            <div className="forge-panel-muted px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
                Quote Status
              </p>
              <h4 className="mt-1 text-lg font-black text-slate-950 dark:text-slate-100">
                {quoteStatusTitle}
              </h4>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {quoteStatusBody}
              </p>
              <div className="mt-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[var(--forge-panel)] px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {quoteStatusTotal}
              </div>
              {quoteComparison.status === 'outdated' && (
                <p className="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Updating will replace current issued v{currentIssuedSnapshot?.snapshot_version} with the
                  updated draft values shown in the cost summary selector.
                </p>
              )}
              {quoteComparison.status === 'outdated' && quoteComparison.differences.length > 0 && (
                <div className="forge-alert-warm mt-4 rounded-md px-3 py-3 text-sm">
                  <p className="font-bold">What changed</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {quoteComparison.differences.map((difference, index) => (
                      <li key={`${index}-${difference}`}>{difference}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">
                Payment Note (internal)
              </label>
              <textarea
                value={project.paymentNote || ''}
                onChange={(e) => updateProject(project.id, { paymentNote: e.target.value })}
                placeholder="Optional context about who pays or where payment is tracked."
                className="forge-command-input min-h-[92px] w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="forge-panel-muted p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
                Payment Record
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {project.moduleOrLecturerPays
                  ? 'Covered by module/lecturer.'
                  : project.needsPayment
                    ? 'Receipt number confirms the payment record for this project.'
                    : 'No student payment required.'}
              </p>
              {project.needsPayment && !project.moduleOrLecturerPays && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-bold text-slate-800 dark:text-slate-200">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    value={project.receiptNumber || ''}
                    onChange={(e) => updateProject(project.id, { receiptNumber: e.target.value })}
                    placeholder="Enter receipt number"
                    className="forge-command-input w-full px-3 py-2 text-sm font-medium"
                  />
                  {!project.receiptNumber?.trim() && (
                    <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Receipt number confirms payment before printing.
                    </p>
                  )}
                </div>
              )}
            </div>

            {project.needsPayment && !project.moduleOrLecturerPays && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Payment Override Note
                </label>
                <textarea
                  value={project.paymentOverrideNote || ''}
                  onChange={(e) => updateProject(project.id, { paymentOverrideNote: e.target.value })}
                  placeholder="Optional approved exception if printing may start before payment is cleared."
                  className="forge-command-input min-h-[92px] w-full px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="forge-panel-muted p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Communication</h3>
            {project.gmailThreadId ? (
              <GmailReplyComposer
                project={project}
                initialBody={replyEmail.plainBody}
                initialHtmlBody={replyEmail.htmlBody}
                getAttachments={
                  replyEmail.attachQuote ? async () => [await getQuotePdfAttachment()] : undefined
                }
                disabled={!quoteIsIssued}
              />
            ) : (
              <Button
                variant="success"
                onClick={sendEmail}
                size="sm"
                className="gap-2 px-3.5"
                disabled={!quoteIsIssued}
                loading={isOpeningGmail}
                loadingText="Opening Gmail…"
                title={!quoteIsIssued ? 'Issue the initial quote before opening communication.' : undefined}
              >
                <img src={gmailIcon} alt="" className="h-4 w-4" />
                Open in Gmail
              </Button>
            )}
          </div>

          <div className="relative">
            <textarea
              className="forge-command-input h-48 w-full p-3 pr-20 text-sm leading-relaxed"
              value={displayedEmailContent}
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="absolute right-5 top-2.5 h-8 w-8 rounded-full border-slate-300 dark:border-slate-700 bg-white dark:bg-[var(--forge-panel)] text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-900"
              aria-label="Copy email to clipboard"
              title="Copy email to clipboard"
              disabled={!quoteIsIssued}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-teal-300 dark:border-teal-800 bg-teal-100 dark:bg-teal-950/55 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-800 dark:text-teal-200">
            Ready for Production
          </p>
          <h3 className="mt-1 text-lg font-black text-teal-950 dark:text-teal-200">
            Confirm Quote and Start Printing
          </h3>
          <p className="mt-2 text-sm font-semibold text-teal-900 dark:text-teal-200">
            {productionReadinessBody}
          </p>
          <Button
            className="mt-4 w-full gap-2"
            variant="success"
            onClick={handleMoveToPrinting}
            title={
              !quoteComparison.hasSnapshot ? 'Issue the initial quote before moving to printing.' : undefined
            }
            disabled={
              project.parts.length === 0 ||
              unverifiedParts.length > 0 ||
              !quoteComparison.hasSnapshot ||
              pendingAction !== null
            }
            loading={pendingAction === 'printing'}
            loadingText="Starting Production…"
          >
            <CheckCircle className="w-5 h-5" /> Confirm Quote and Start Printing
          </Button>
          {!quoteComparison.hasSnapshot && (
            <p className="mt-2 text-xs font-semibold text-teal-800 dark:text-teal-200">
              Download, communication, and production unlock after the first quote is issued.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
        <Button
          variant="outline"
          className="gap-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-950/55"
          onClick={handleArchive}
          disabled={pendingAction !== null}
          loading={pendingAction === 'archive'}
          loadingText="Archiving…"
        >
          <Archive className="w-4 h-4" /> Cancel / Archive Project
        </Button>
      </div>
    </div>
  );
}
