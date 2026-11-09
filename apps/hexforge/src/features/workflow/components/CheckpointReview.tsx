import { PartItem } from '@/features/workflow/components/PartItem';
import { Upload, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { isPartVerifiedForReview } from '@/shared/model/partVerification';
import type { CheckpointReviewProps } from '../model/partReviewModel';
import { usePartReview } from '../hooks/usePartReview';

export function CheckpointReview(props: CheckpointReviewProps) {
  const { project } = props;
  const {
    loading,
    advancing,
    isDragActive,
    fileInputRef,
    processFiles,
    handleFinishReview,
    handleManualAdd,
  } = usePartReview(props);
  return (
    <div className="relative space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        id="gcode-upload"
        className="hidden"
        accept=".3mf,.gcode.3mf,.ufp"
        multiple
        onChange={(e) => {
          if (e.currentTarget.files) {
            const selectedFiles = Array.from(e.currentTarget.files);
            e.currentTarget.value = '';
            void processFiles(selectedFiles);
          }
        }}
      />

      {isDragActive && (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drop-pages-title"
        >
          <div className="forge-modal flex min-h-52 w-full max-w-xl flex-col items-center justify-center border-2 border-dashed border-sky-300 dark:border-sky-800 p-10 text-center shadow-2xl">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-100 dark:bg-sky-950/55 shadow-sm">
              <Upload className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 id="drop-pages-title" className="text-3xl font-black text-slate-950 dark:text-slate-100">
              Drop Pages
            </h2>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Parts List ({project.parts.length})
          </h3>
          <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Add Files
          </Button>
          <Button variant="outline" onClick={handleManualAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Manual Parts
          </Button>
        </div>
        <Button
          onClick={handleFinishReview}
          disabled={
            project.parts.length === 0 || project.parts.some((part) => !isPartVerifiedForReview(part))
          }
          loading={advancing}
          loadingText="Moving to Quote…"
          title={
            project.parts.length === 0
              ? 'Add at least one part first.'
              : project.parts.some((part) => !isPartVerifiedForReview(part))
                ? 'Verify every part first.'
                : undefined
          }
        >
          Move to Quote
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {project.parts.length === 0 ? (
          <div className="forge-empty p-12 text-center text-slate-600 dark:text-slate-400">
            No parts added yet. Use Add Files or drag files onto this page to get started.
          </div>
        ) : (
          project.parts.map((part) => <PartItem key={part.id} part={part} projectId={project.id} />)
        )}
      </div>
    </div>
  );
}
