/**
 * useVersionHistory Hook
 *
 * Manages version history for trip plans.
 * Tracks changes and provides version comparison functionality.
 */

import { useState, useCallback } from 'react';
import { VersionHistory, TripSkeleton, VersionChange } from '../types';

export interface UseVersionHistoryReturn {
  versionHistory: VersionHistory[];
  currentVersion: number;
  addVersion: (version: VersionHistory) => void;
  createVersion: (
    skeleton: TripSkeleton,
    changes: VersionChange[],
    author: string,
    summary?: string
  ) => void;
  getVersion: (versionId: string) => VersionHistory | undefined;
  getVersionByNumber: (versionNumber: number) => VersionHistory | undefined;
  compareVersions: (v1: number, v2: number) => VersionChange[] | null;
  resetHistory: () => void;
}

export const useVersionHistory = (): UseVersionHistoryReturn => {
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);

  const addVersion = useCallback((version: VersionHistory) => {
    setVersionHistory(prev => [...prev, version]);
    setCurrentVersion(prev => Math.max(prev, version.version));
  }, []);

  const createVersion = useCallback((
    skeleton: TripSkeleton,
    changes: VersionChange[],
    author: string,
    summary?: string
  ) => {
    const newVersion: VersionHistory = {
      id: Date.now().toString(),
      version: currentVersion + 1,
      timestamp: Date.now(),
      author,
      changes,
      skeleton,
      summary: summary || changes.map(c => c.description).join('; ')
    };
    addVersion(newVersion);
  }, [currentVersion, addVersion]);

  const getVersion = useCallback((versionId: string) => {
    return versionHistory.find(v => v.id === versionId);
  }, [versionHistory]);

  const getVersionByNumber = useCallback((versionNumber: number) => {
    return versionHistory.find(v => v.version === versionNumber);
  }, [versionHistory]);

  const compareVersions = useCallback((v1: number, v2: number) => {
    const version1 = getVersionByNumber(v1);
    const version2 = getVersionByNumber(v2);

    if (!version1 || !version2) return null;

    // Return changes from the earlier version to the later version
    const earlier = v1 < v2 ? version1 : version2;
    const later = v1 < v2 ? version2 : version1;

    return later.changes;
  }, [getVersionByNumber]);

  const resetHistory = useCallback(() => {
    setVersionHistory([]);
    setCurrentVersion(0);
  }, []);

  return {
    versionHistory,
    currentVersion,
    addVersion,
    createVersion,
    getVersion,
    getVersionByNumber,
    compareVersions,
    resetHistory
  };
};
