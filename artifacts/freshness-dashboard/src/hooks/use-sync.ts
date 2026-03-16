import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetSettings,
  useUpdateSettings,
  useSyncSitemap,
  useSyncGsc,
  useGetSyncStatus,
  getGetPagesQueryKey,
  getGetStatsQueryKey,
  getGetSettingsQueryKey,
  getGetSyncStatusQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const { data: syncStatus } = useGetSyncStatus();
  return { settings, syncStatus, isLoading };
}

export function useSyncActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
  };

  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Settings saved", description: "Your settings have been updated." });
      },
      onError: (err: any) => {
        toast({ title: "Save failed", description: err?.message || "Could not save settings.", variant: "destructive" });
      },
    },
  });

  const syncSitemap = useSyncSitemap({
    mutation: {
      onSuccess: (data) => {
        invalidateAll();
        toast({
          title: data.success ? "Sitemap Sync Complete" : "Sitemap Sync Issue",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      },
      onError: (err: any) => {
        toast({ title: "Sync Failed", description: err?.message || "Sitemap sync failed.", variant: "destructive" });
      },
    },
  });

  const syncGsc = useSyncGsc({
    mutation: {
      onSuccess: (data) => {
        invalidateAll();
        toast({
          title: data.success ? "GSC Sync Complete" : "GSC Sync Issue",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      },
      onError: (err: any) => {
        toast({ title: "Sync Failed", description: err?.message || "GSC sync failed.", variant: "destructive" });
      },
    },
  });

  return { updateSettings, syncSitemap, syncGsc };
}
