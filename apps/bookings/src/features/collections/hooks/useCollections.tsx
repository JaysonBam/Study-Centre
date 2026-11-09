import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLayout } from '@/shared/context/LayoutContext';
import {
  collectHexForgeParts,
  fetchHexForgeCollectionBoard,
  fetchHexForgeCollectionProject,
  prepareHexForgeCollectionEmail,
  releaseHexForgeCollectionProject,
  saveHexForgeCollectionReceipt,
  searchHexForgeCollection,
  type HexForgeCollectionBoardItem,
  type HexForgeCollectionPart,
  type HexForgeCollectionProject,
} from '@/api/printingCollections';
import {
  boardItemFromProject,
  mergeCollectionBoardItems,
  searchCollectionBoard,
} from '../model/collectionBoard';
import { type CollectionEmailPreviewData } from '../components/CollectionEmailPreviewDialog';
import {
  SnackbarState,
  normalizeProjectCode,
  extractStudentNumber,
  getSavedReceipt,
  projectNeedsReceipt,
  projectIsPaid,
  canCollectPart,
  isCollectedPart,
} from '../model/collectionsModel';

export function useCollections() {
  const theme = useTheme();

  const { setHeaderContent } = useLayout();

  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const previousProjectCodeRef = useRef<string | null>(null);

  const projectCacheRef = useRef(new Map<string, HexForgeCollectionProject>());

  const collectionSubmittingRef = useRef(false);

  const [boardItems, setBoardItems] = useState<HexForgeCollectionBoardItem[]>([]);

  const [boardLoading, setBoardLoading] = useState(true);

  const [boardError, setBoardError] = useState('');

  const [query, setQuery] = useState('');

  const [matches, setMatches] = useState<HexForgeCollectionBoardItem[]>([]);

  const [searching, setSearching] = useState(false);

  const [activeProjectCode, setActiveProjectCode] = useState<string | null>(null);

  const [project, setProject] = useState<HexForgeCollectionProject | null>(null);

  const [projectLoading, setProjectLoading] = useState(false);

  const [receiptDraft, setReceiptDraft] = useState('');

  const [receiptSaving, setReceiptSaving] = useState(false);

  const [collectorName, setCollectorName] = useState('');

  const [collectedByStudentNumber, setCollectedByStudentNumber] = useState('');

  const [collectingPartIds, setCollectingPartIds] = useState<string[]>([]);

  const [pendingCollectionPartIds, setPendingCollectionPartIds] = useState<string[]>([]);

  const [imagePreviewPart, setImagePreviewPart] = useState<HexForgeCollectionPart | null>(null);

  const [releaseItem, setReleaseItem] = useState<HexForgeCollectionBoardItem | null>(null);

  const [releaseLabel, setReleaseLabel] = useState('');

  const [releasing, setReleasing] = useState(false);

  const [emailingCodes, setEmailingCodes] = useState<string[]>([]);

  const [emailPreview, setEmailPreview] = useState<CollectionEmailPreviewData | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const focusScanner = useCallback(() => {
    window.setTimeout(() => scanInputRef.current?.focus(), 0);
  }, []);

  const updateBoardFromProject = useCallback((updatedProject: HexForgeCollectionProject) => {
    projectCacheRef.current.set(updatedProject.project_code, updatedProject);
    const updatedItem = boardItemFromProject(updatedProject);
    setBoardItems((current) => {
      const withoutProject = current.filter((item) => item.project_code !== updatedProject.project_code);
      if (!updatedItem.group || (updatedItem.group === 'help_desk' && updatedItem.remaining_parts === 0))
        return withoutProject;
      return mergeCollectionBoardItems(withoutProject, [updatedItem]);
    });
    setMatches((current) =>
      current.map((item) => (item.project_code === updatedItem.project_code ? updatedItem : item)),
    );
    setProject(updatedProject);
  }, []);

  const loadBoard = useCallback(async () => {
    setBoardLoading(true);
    setBoardError('');
    try {
      const data = await fetchHexForgeCollectionBoard();
      setBoardItems(data || []);
    } catch (error) {
      console.error('Failed to load HexForge collection board:', error);
      setBoardError(error instanceof Error ? error.message : 'Failed to load the collection board.');
    } finally {
      setBoardLoading(false);
      focusScanner();
    }
  }, [focusScanner]);

  useEffect(() => {
    setHeaderContent(
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
        3D Print Collection
      </Typography>,
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    setReceiptDraft(getSavedReceipt(project));
    const projectCode = project?.project_code || null;
    if (projectCode && previousProjectCodeRef.current && previousProjectCodeRef.current !== projectCode) {
      setCollectorName('');
      setCollectedByStudentNumber('');
    }
    if (projectCode) previousProjectCodeRef.current = projectCode;
  }, [project]);

  const openProject = useCallback(
    async (projectCode: string) => {
      const code = normalizeProjectCode(projectCode);
      if (!/^[A-Z0-9]{5}$/.test(code)) {
        showToast('Enter a valid five-character project code.', 'error');
        return;
      }

      setMatches([]);
      setActiveProjectCode(code);
      const cached = projectCacheRef.current.get(code);
      if (cached) {
        setProject(cached);
        return;
      }

      setProject(null);
      setProjectLoading(true);
      try {
        const data = await fetchHexForgeCollectionProject(code);
        projectCacheRef.current.set(code, data);
        setProject(data);
      } catch (error) {
        console.error('Failed to load HexForge collection project:', error);
        setActiveProjectCode(null);
        showToast(error instanceof Error ? error.message : 'Project not found.', 'error');
      } finally {
        setProjectLoading(false);
      }
    },
    [showToast],
  );

  const runSearch = useCallback(async () => {
    if (projectLoading || searching) return;
    const rawQuery = query.trim();
    if (!rawQuery) {
      showToast('Enter a project code, student number, name, or collection label.', 'info');
      return;
    }

    setMatches([]);
    const localMatches = searchCollectionBoard(boardItems, rawQuery);
    const exactCode = normalizeProjectCode(rawQuery);
    const exactLocal = /^[A-Z0-9]{5}$/.test(exactCode)
      ? localMatches.find((item) => item.project_code === exactCode)
      : undefined;
    if (exactLocal) {
      await openProject(exactLocal.project_code);
      return;
    }
    if (localMatches.length === 1) {
      await openProject(localMatches[0].project_code);
      return;
    }
    if (localMatches.length > 1) {
      setMatches(localMatches);
      return;
    }

    setSearching(true);
    try {
      const remoteMatches = await searchHexForgeCollection(extractStudentNumber(rawQuery) || rawQuery);
      setBoardItems((current) => mergeCollectionBoardItems(current, remoteMatches || []));
      if (!remoteMatches?.length) {
        showToast('No active HexForge projects matched that search.', 'info');
      } else {
        const exactRemote = /^[A-Z0-9]{5}$/.test(exactCode)
          ? remoteMatches.find((item) => item.project_code === exactCode)
          : undefined;
        if (exactRemote || remoteMatches.length === 1) {
          await openProject((exactRemote || remoteMatches[0]).project_code);
        } else {
          setMatches(remoteMatches);
        }
      }
    } catch (error) {
      console.error('Failed to search HexForge:', error);
      showToast(error instanceof Error ? error.message : 'Could not search HexForge.', 'error');
    } finally {
      setSearching(false);
      focusScanner();
    }
  }, [boardItems, focusScanner, openProject, projectLoading, query, searching, showToast]);

  const closeProject = () => {
    if (collectingPartIds.length > 0 || receiptSaving) return;
    setActiveProjectCode(null);
    setProject(null);
    setPendingCollectionPartIds([]);
    setImagePreviewPart(null);
    focusScanner();
  };

  const handleSaveReceipt = async () => {
    if (!project) return;
    const receiptNumber = receiptDraft.trim();
    if (!receiptNumber) {
      showToast('Enter a receipt number before saving.', 'error');
      return;
    }

    setReceiptSaving(true);
    try {
      const refreshedProject = await saveHexForgeCollectionReceipt(project.project_code, receiptNumber);
      updateBoardFromProject(refreshedProject);
      showToast('Receipt number saved.');
    } catch (error) {
      console.error('Failed to save receipt:', error);
      showToast(error instanceof Error ? error.message : 'Could not save receipt number.', 'error');
    } finally {
      setReceiptSaving(false);
    }
  };

  const validateCollection = useCallback(
    (partIds: string[]) => {
      if (!project) return false;
      if (!collectorName.trim()) {
        showToast('Enter the assisting staff member before collecting.', 'error');
        return false;
      }
      if (!extractStudentNumber(collectedByStudentNumber)) {
        showToast('Enter the eight-digit student number of the person collecting.', 'error');
        return false;
      }
      if (!projectIsPaid(project)) {
        showToast('Save a receipt number before collecting paid parts.', 'error');
        return false;
      }
      if (partIds.length === 0) {
        showToast('Select at least one ready part before collecting.', 'error');
        return false;
      }
      return true;
    },
    [collectedByStudentNumber, collectorName, project, showToast],
  );

  const requestCollectionConfirmation = useCallback(
    (partIds: string[]) => {
      if (validateCollection(partIds)) setPendingCollectionPartIds(partIds);
    },
    [validateCollection],
  );

  const collectParts = async (partIds: string[]) => {
    if (!project || !validateCollection(partIds) || collectionSubmittingRef.current) return false;
    setCollectingPartIds(partIds);
    collectionSubmittingRef.current = true;
    try {
      const result = await collectHexForgeParts(
        project.project_code,
        partIds,
        collectorName.trim(),
        extractStudentNumber(collectedByStudentNumber),
      );
      updateBoardFromProject(result.project);
      showToast(partIds.length === 1 ? 'Part collected.' : 'Collectable parts collected.');
      return true;
    } catch (error) {
      console.error('Failed to collect HexForge parts:', error);
      showToast(error instanceof Error ? error.message : 'Collection failed.', 'error');
      return false;
    } finally {
      setCollectingPartIds([]);
      collectionSubmittingRef.current = false;
    }
  };

  const confirmCollection = async () => {
    if (collectingPartIds.length > 0) return;
    if (await collectParts(pendingCollectionPartIds)) setPendingCollectionPartIds([]);
  };

  const openRelease = (item: HexForgeCollectionBoardItem) => {
    setReleaseItem(item);
    setReleaseLabel(item.print_label || '');
  };

  const confirmRelease = async () => {
    if (!releaseItem || releasing) return;
    setReleasing(true);
    try {
      const result = await releaseHexForgeCollectionProject(
        releaseItem.project_code,
        releaseLabel.trim() || undefined,
      );
      updateBoardFromProject(result.project);
      setReleaseItem(null);
      showToast('Project moved to the help desk.');
    } catch (error) {
      console.error('Failed to release project:', error);
      showToast(
        error instanceof Error ? error.message : 'Could not move the project to the help desk.',
        'error',
      );
    } finally {
      setReleasing(false);
    }
  };

  const openEmail = async (item: HexForgeCollectionBoardItem) => {
    if (emailingCodes.includes(item.project_code)) return;
    setEmailingCodes((current) => [...current, item.project_code]);
    try {
      const email = await prepareHexForgeCollectionEmail(item.project_code);
      setEmailPreview({ draft: email });
    } catch (error) {
      console.error('Failed to prepare collection email:', error);
      showToast(error instanceof Error ? error.message : 'Could not prepare the collection email.', 'error');
    } finally {
      setEmailingCodes((current) => current.filter((code) => code !== item.project_code));
    }
  };

  const helpDeskItems = useMemo(
    () => boardItems.filter((item) => item.group === 'help_desk' && item.remaining_parts > 0),
    [boardItems],
  );

  const partiallyReadyItems = useMemo(
    () => boardItems.filter((item) => item.group === 'partially_ready'),
    [boardItems],
  );

  const collectableParts = useMemo(
    () => project?.parts.filter((part) => canCollectPart(part) && !isCollectedPart(part)) || [],
    [project],
  );

  const partStatusSummary = useMemo(() => {
    const parts = project?.parts || [];
    const collected = parts.filter(isCollectedPart).length;
    const ready = parts.filter((part) => canCollectPart(part) && !isCollectedPart(part)).length;
    return { shown: parts.length, ready, collected, notReady: parts.length - ready - collected };
  }, [project]);

  const pendingCollectionParts = useMemo(
    () =>
      pendingCollectionPartIds
        .map((partId) => project?.parts.find((part) => part.part_id === partId))
        .filter((part): part is HexForgeCollectionPart => Boolean(part)),
    [pendingCollectionPartIds, project],
  );

  const collectionBlocked = projectNeedsReceipt(project) && !getSavedReceipt(project).trim();

  const savedReceipt = getSavedReceipt(project);
  return {
    theme,
    scanInputRef,
    boardLoading,
    boardError,
    query,
    setQuery,
    matches,
    setMatches,
    searching,
    activeProjectCode,
    project,
    projectLoading,
    receiptDraft,
    setReceiptDraft,
    receiptSaving,
    collectorName,
    setCollectorName,
    collectedByStudentNumber,
    setCollectedByStudentNumber,
    collectingPartIds,
    pendingCollectionPartIds,
    setPendingCollectionPartIds,
    imagePreviewPart,
    setImagePreviewPart,
    releaseItem,
    setReleaseItem,
    releaseLabel,
    setReleaseLabel,
    releasing,
    emailingCodes,
    emailPreview,
    setEmailPreview,
    snackbar,
    setSnackbar,
    showToast,
    loadBoard,
    openProject,
    runSearch,
    closeProject,
    handleSaveReceipt,
    requestCollectionConfirmation,
    confirmCollection,
    openRelease,
    confirmRelease,
    openEmail,
    helpDeskItems,
    partiallyReadyItems,
    collectableParts,
    partStatusSummary,
    pendingCollectionParts,
    collectionBlocked,
    savedReceipt,
  };
}
