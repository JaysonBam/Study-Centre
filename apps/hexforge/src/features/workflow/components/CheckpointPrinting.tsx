import type { Project } from '@/api/projectTypes';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Play, Check, Undo2, AlertTriangle } from 'lucide-react';
import { PartSourceFileButton } from '@/features/local-files/components/PartSourceFileButton';
import { sourceFileName } from '@/features/local-files/model/sourceFileLink';
import { useProduction } from '../hooks/useProduction';

export function CheckpointPrinting(props: { project: Project; onAdvanceToCollection?: () => void }) {
  const { project } = props;
  const {
    printers,
    brands,
    staffOptions,
    activeAction,
    selectedPrinter,
    setSelectedPrinter,
    primaryBrand,
    setPrimaryBrand,
    secondaryBrand,
    setSecondaryBrand,
    failureReason,
    setFailureReason,
    actionStaffName,
    setActionStaffName,
    formErrors,
    setFormErrors,
    pendingAction,
    openStart,
    openFinish,
    openFail,
    closeAction,
    confirmAction,
    allCollectionReady,
    handleNextStage,
    handleRequeue,
    activePart,
    queuedParts,
    printingParts,
    printedParts,
    getProductionLabel,
    getRecentRunSummary,
    renderRunHistory,
  } = useProduction(props);
  return (
    <div className="relative w-full space-y-6">
      {activeAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px]">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="forge-modal w-full max-w-sm space-y-4 p-6">
              <h3 className="border-b border-slate-300 dark:border-slate-700 pb-2 text-lg font-bold">
                {activeAction.type === 'START'
                  ? 'Start Print Job'
                  : activeAction.type === 'FINISH'
                    ? 'Finish Print Job'
                    : 'Fail Print Job'}
              </h3>

              <div className="space-y-3">
                {activeAction.type === 'START' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Machine</label>
                      <input
                        type="text"
                        className={`forge-command-input w-full p-2 ${formErrors.selectedPrinter ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40' : ''}`}
                        value={selectedPrinter}
                        onChange={(e) => setSelectedPrinter(e.target.value)}
                        list="printers-modal"
                        placeholder="Type or choose a machine"
                      />
                      <datalist id="printers-modal">
                        {printers.map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                      {formErrors.selectedPrinter && (
                        <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {formErrors.selectedPrinter}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Primary Material Brand</label>
                      <input
                        type="text"
                        className="forge-command-input w-full p-2"
                        value={primaryBrand}
                        list="brands-modal"
                        onChange={(e) => setPrimaryBrand(e.target.value)}
                        placeholder="E.g. Polymaker"
                      />
                      <datalist id="brands-modal">
                        {brands.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                    {activePart?.secondaryMaterial && (
                      <div>
                        <label className="mb-1 block text-sm font-medium">Secondary Material Brand</label>
                        <input
                          type="text"
                          className="forge-command-input w-full p-2"
                          value={secondaryBrand}
                          list="brands-modal"
                          onChange={(e) => setSecondaryBrand(e.target.value)}
                          placeholder="Brand name"
                        />
                      </div>
                    )}
                  </>
                )}

                {activeAction.type === 'FAIL' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Failure Reason</label>
                    <textarea
                      className={`forge-command-input w-full p-2 ${formErrors.failureReason ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40' : ''}`}
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      placeholder="What needs to be fixed before re-run?"
                      rows={3}
                    />
                    {formErrors.failureReason && (
                      <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {formErrors.failureReason}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">Staff member</label>
                  <select
                    className={`forge-command-input w-full p-2 ${formErrors.actionStaffName ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40' : ''}`}
                    value={actionStaffName}
                    onChange={(event) => {
                      setActionStaffName(event.target.value);
                      setFormErrors((previous) => ({ ...previous, actionStaffName: '' }));
                    }}
                  >
                    <option value="">Select a staff member</option>
                    {staffOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {formErrors.actionStaffName && (
                    <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {formErrors.actionStaffName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeAction} disabled={pendingAction !== null}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction}
                  loading={pendingAction?.endsWith(`:${activeAction.partId}`)}
                  loadingText="Saving…"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Printing Dashboard</h2>
          {allCollectionReady && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              All parts are complete. Keep the project in production until you are ready to release it to
              collection.
            </p>
          )}
        </div>
        {allCollectionReady && (
          <Button
            onClick={handleNextStage}
            loading={pendingAction === 'next-stage'}
            loadingText="Moving to Collection…"
          >
            Move to Collection
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="forge-lane forge-lane-blue min-h-[400px] border p-4">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            QUEUED
            <span className="forge-pill px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200">
              {queuedParts.length}
            </span>
          </h3>
          <div className="space-y-3">
            {queuedParts.map((part) => (
              <Card key={part.id} className="border-l-4 border-l-sky-500 p-3 shadow-sm">
                <div className="flex gap-3">
                  {part.imageUrl && (
                    <img
                      src={part.imageUrl}
                      alt={part.partName}
                      className="h-12 w-12 rounded border bg-white dark:bg-[var(--forge-panel)] object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <div className="font-medium">{part.partName}</div>
                    {part.sourceFilePath && (
                      <div
                        className="mt-1 truncate font-mono text-[11px] text-slate-600 dark:text-slate-400"
                        title={part.sourceFilePath}
                      >
                        File: {sourceFileName(part.sourceFilePath)}
                      </div>
                    )}
                    {part.specialInstruction && part.specialInstruction.trim() !== '' && (
                      <div className="mt-1 text-sm italic text-slate-700 dark:text-slate-300">
                        Note: {part.specialInstruction}
                      </div>
                    )}
                    <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {part.primaryMaterial}
                      {part.secondaryMaterial ? ` + ${part.secondaryMaterial}` : ''} -{' '}
                      {part.primaryEstimatedWeight}g
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Status: {getProductionLabel(part.printStatus)}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {getRecentRunSummary(part)}
                    </div>
                    {renderRunHistory(part)}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <PartSourceFileButton part={part} project={project} />
                  <Button
                    onClick={() => openStart(part.id)}
                    size="sm"
                    className="flex-1 gap-2"
                    disabled={pendingAction !== null}
                  >
                    <Play size={14} /> Start
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="forge-lane forge-lane-indigo min-h-[400px] border p-4">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
            PRINTING
            <span className="forge-pill px-2 py-0.5 text-xs text-indigo-900 dark:text-indigo-200">
              {printingParts.length}
            </span>
          </h3>
          <div className="space-y-3">
            {printingParts.map((part) => (
              <Card key={part.id} className="border-l-4 border-l-indigo-500 p-3 shadow-sm">
                <div className="flex gap-3">
                  {part.imageUrl && (
                    <img
                      src={part.imageUrl}
                      alt={part.partName}
                      className="h-12 w-12 rounded border bg-white dark:bg-[var(--forge-panel)] object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <div className="font-medium">{part.partName}</div>
                    {part.sourceFilePath && (
                      <div
                        className="mt-1 truncate font-mono text-[11px] text-slate-600 dark:text-slate-400"
                        title={part.sourceFilePath}
                      >
                        File: {sourceFileName(part.sourceFilePath)}
                      </div>
                    )}
                    {part.specialInstruction && part.specialInstruction.trim() !== '' && (
                      <div className="mt-1 text-sm italic text-indigo-700 dark:text-indigo-300">
                        Note: {part.specialInstruction}
                      </div>
                    )}
                    <div className="mt-1 text-sm font-mono text-indigo-700 dark:text-indigo-300">
                      On: {part.printerName}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Started by: {part.startedBy}
                    </div>
                    <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                      {getRecentRunSummary(part)}
                    </div>
                    {renderRunHistory(part)}
                  </div>
                </div>
                <div className="mt-3 flex w-full gap-2">
                  <PartSourceFileButton part={part} project={project} />
                  <Button
                    onClick={() => handleRequeue(part.id)}
                    size="sm"
                    variant="outline"
                    title="Revert to queued"
                    className="h-auto w-10 shrink-0 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    disabled={pendingAction !== null}
                  >
                    <Undo2 size={14} />
                  </Button>
                  <Button
                    onClick={() => openFail(part.id)}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/55"
                    disabled={pendingAction !== null}
                  >
                    <AlertTriangle size={14} /> Fail
                  </Button>
                  <Button
                    onClick={() => openFinish(part.id)}
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 hover:border-green-300 dark:hover:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/55 hover:text-green-800 dark:hover:text-green-200"
                    disabled={pendingAction !== null}
                  >
                    <Check size={14} /> Finish
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="forge-lane forge-lane-teal min-h-[400px] border p-4">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
            PRINTED
            <span className="forge-pill px-2 py-0.5 text-xs text-teal-900 dark:text-teal-200">
              {printedParts.length}
            </span>
          </h3>
          <div className="space-y-3">
            {printedParts.map((part) => (
              <Card
                key={part.id}
                className="border-l-4 border-l-teal-600 bg-white dark:bg-[var(--forge-panel)] p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  {part.imageUrl && (
                    <img
                      src={part.imageUrl}
                      alt={part.partName}
                      className="h-12 w-12 rounded border bg-white dark:bg-[var(--forge-panel)] object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{part.partName}</div>
                    {part.sourceFilePath && (
                      <div
                        className="mt-1 truncate font-mono text-[11px] text-slate-600 dark:text-slate-400"
                        title={part.sourceFilePath}
                      >
                        File: {sourceFileName(part.sourceFilePath)}
                      </div>
                    )}
                    {part.specialInstruction && part.specialInstruction.trim() !== '' && (
                      <div className="mt-1 text-sm italic text-teal-700 dark:text-teal-300">
                        Note: {part.specialInstruction}
                      </div>
                    )}
                    <div className="mt-1 text-sm font-mono text-slate-700 dark:text-slate-300">
                      On: {part.printerName}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Started by: {part.startedBy}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Removed by: {part.removedBy}
                    </div>
                    <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                      Status: {getProductionLabel(part.printStatus)}
                    </div>
                    <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                      {getRecentRunSummary(part)}
                    </div>
                    {renderRunHistory(part)}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <PartSourceFileButton part={part} project={project} />
                  {part.printStatus !== 'COLLECTED' && (
                    <Button
                      onClick={() => handleRequeue(part.id)}
                      size="sm"
                      variant="outline"
                      title="Requeue this part"
                      className="h-8 gap-2 px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                      disabled={pendingAction !== null}
                    >
                      <Undo2 size={14} /> Requeue
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
