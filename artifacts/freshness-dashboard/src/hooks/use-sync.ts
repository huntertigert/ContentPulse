import { useGetSettings, useGetSyncStatus } from "@workspace/api-client-react";

export function useSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const { data: syncStatus } = useGetSyncStatus();
  return { settings, syncStatus, isLoading };
}
