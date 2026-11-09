import type { Project } from '@/api/projectTypes';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { buildProjectQuoteAttachment } from '@/features/reports/lib/projectQuoteAttachment';
import { Copy, CheckSquare, RotateCcw } from 'lucide-react';
import gmailIcon from '@/shared/assets/icons/gmail.svg';
import { GmailReplyComposer } from '@/features/gmail/components/GmailReplyComposer';
import { useCollection } from '../hooks/useCollection';

export function CheckpointCollection(props: { project: Project; onReturnToProduction?: () => void }) {
  const { project } = props;
  const {
    updateProject,
    getFilamentPrice,
    filaments,
    providedFilamentPricePerGram,
    activeStaffName,
    isOpeningGmail,
    collectionAction,
    displayedReceiptTotal,
    printableCollectionParts,
    isPaymentBlocked,
    returnForReprint,
    collectPart,
    collectAll,
    replyEmail,
    emailContent,
    copyToClipboard,
    sendEmail,
  } = useCollection(props);
  return (
    <Card className="w-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Collection</h2>
        {printableCollectionParts.length > 0 &&
          printableCollectionParts.some((p) => p.printStatus !== 'COLLECTED') && (
            <Button
              onClick={collectAll}
              size="sm"
              className="gap-2 bg-teal-700 text-white hover:bg-teal-800"
              disabled={isPaymentBlocked || collectionAction !== null}
              loading={collectionAction === 'all'}
              loadingText="Collecting All…"
              title={isPaymentBlocked ? 'Enter the receipt number before collecting.' : undefined}
            >
              <CheckSquare className="w-4 h-4" /> Collect All Uncollected
            </Button>
          )}
      </div>

      <div className="forge-panel-muted mb-6 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-md border border-sky-300 dark:border-sky-800 bg-sky-100 dark:bg-sky-950/55 py-1 pl-3 pr-1 shadow-sm">
            <span className="text-sm font-semibold text-sky-900 dark:text-sky-200">Print Label:</span>
            <input
              type="text"
              value={project.printLabel || ''}
              onChange={(e) => updateProject(project.id, { printLabel: e.target.value })}
              placeholder="E.g. Tray A1"
              className="forge-command-input w-32 px-2 py-1 text-sm text-sky-950 dark:text-sky-200"
            />
          </div>

          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Collection total: R {displayedReceiptTotal.toFixed(2)}
          </div>

          <div className="flex flex-col items-end gap-2">
            {project.needsPayment && !project.moduleOrLecturerPays && (
              <div className="flex flex-col items-start gap-1">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={project.receiptNumber || ''}
                  onChange={(e) => updateProject(project.id, { receiptNumber: e.target.value })}
                  placeholder="Enter receipt number"
                  className={`w-52 rounded-md border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 ${
                    isPaymentBlocked
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-rose-500'
                      : 'forge-command-input text-slate-900 dark:text-slate-100'
                  }`}
                />
              </div>
            )}

            {isPaymentBlocked && (
              <div className="rounded border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/55 px-2 py-1 text-xs font-semibold text-red-800 dark:text-red-200">
                Enter the receipt number before collection can proceed.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="forge-panel-muted mt-8 mb-6 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Communication</h3>
          <div className="flex flex-wrap justify-end gap-2">
            {project.gmailThreadId ? (
              <GmailReplyComposer
                project={project}
                initialBody={replyEmail.plainBody}
                initialHtmlBody={replyEmail.htmlBody}
                getAttachments={
                  replyEmail.attachQuote
                    ? async () => [
                        await buildProjectQuoteAttachment(
                          project,
                          getFilamentPrice,
                          filaments,
                          providedFilamentPricePerGram,
                        ),
                      ]
                    : undefined
                }
              />
            ) : (
              <Button
                variant="success"
                onClick={sendEmail}
                size="sm"
                className="gap-2 px-3.5"
                loading={isOpeningGmail}
                loadingText="Opening Gmail…"
              >
                <img src={gmailIcon} alt="" className="h-4 w-4" />
                Open in Gmail
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              className="forge-command-input h-40 w-full p-3 pr-20 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300"
              value={emailContent}
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
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {printableCollectionParts.length === 0 ? (
        <div className="forge-empty px-4 py-8 text-center text-slate-700 dark:text-slate-300">
          No printed parts to collect yet.
        </div>
      ) : (
        <div className="space-y-3">
          {printableCollectionParts.map((part) => (
            <Card
              key={part.id}
              className={`flex items-center justify-between p-3 ${part.printStatus === 'COLLECTED' ? 'border-teal-300 dark:border-teal-800 bg-teal-100/80 dark:bg-teal-950/80 opacity-80' : ''}`}
            >
              <div className="flex items-center gap-4">
                {part.imageUrl && (
                  <img
                    src={part.imageUrl}
                    alt={part.partName}
                    className="h-16 w-16 rounded border bg-white dark:bg-[var(--forge-panel)] object-contain"
                  />
                )}
                <div>
                  <div className="font-medium">{part.partName}</div>
                  {part.specialInstruction && part.specialInstruction.trim() !== '' && (
                    <div className="text-sm italic text-slate-700 dark:text-slate-300">
                      Note: {part.specialInstruction}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Removed by: {part.removedBy}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Status: {part.printStatus}
                  </div>
                </div>
              </div>

              <div className="w-64 flex-shrink-0 space-y-2">
                {part.printStatus !== 'COLLECTED' ? (
                  <>
                    <div className="flex gap-2">
                      <div
                        className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${activeStaffName ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200' : 'forge-alert-warm'}`}
                      >
                        {activeStaffName || 'Set the current staff member in the header.'}
                      </div>
                      <Button
                        onClick={() => collectPart(part.id)}
                        size="sm"
                        className="bg-teal-700 text-white hover:bg-teal-800"
                        disabled={isPaymentBlocked || collectionAction !== null}
                        loading={collectionAction === part.id}
                        loadingText="Collecting…"
                        title={isPaymentBlocked ? 'Enter the receipt number before collecting.' : undefined}
                      >
                        Collect
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-medium text-teal-900 dark:text-teal-200">
                    Assisted by: {part.collectedBy}
                  </div>
                )}
                <Button
                  onClick={() => returnForReprint(part)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={project.state === 'CANCELLED' || collectionAction !== null}
                  loading={collectionAction === `reprint:${part.id}`}
                  loadingText="Returning…"
                  title="Return this part to the normal printing queue"
                >
                  <RotateCcw size={14} /> Reprint
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
