import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetPages, 
  useGetStats, 
  useUploadCsv, 
  useUploadSemrushCsv,
  useDeletePage,
  useBatchUpdateStatus,
  getGetPagesQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useDashboardData() {
  const { data: pages, isLoading: isLoadingPages, error: pagesError } = useGetPages();
  const { data: stats, isLoading: isLoadingStats } = useGetStats();

  return {
    pages: pages || [],
    stats,
    isLoading: isLoadingPages || isLoadingStats,
    error: pagesError
  };
}

export function useDashboardMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadCsvMutation = useUploadCsv({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: "Import Successful",
          description: `Imported ${data.imported} pages. Skipped ${data.skipped}.`,
          variant: "default",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Import Failed",
          description: error?.message || "Could not process CSV data.",
          variant: "destructive",
        });
      }
    }
  });

  const deletePageMutation = useDeletePage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: "Page Removed",
          description: "The page has been removed from tracking.",
        });
      },
      onError: () => {
        toast({
          title: "Action Failed",
          description: "Could not remove the page.",
          variant: "destructive",
        });
      }
    }
  });

  const uploadSemrushCsvMutation = useUploadSemrushCsv({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: "SEMrush Import Successful",
          description: `Processed ${data.imported} keyword rows. Matched ${data.matched} pages with keyword data.`,
          variant: "default",
        });
      },
      onError: (error: any) => {
        toast({
          title: "SEMrush Import Failed",
          description: error?.message || "Could not process SEMrush CSV data.",
          variant: "destructive",
        });
      }
    }
  });

  const batchStatusMutation = useBatchUpdateStatus({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
        const statusLabels: Record<string, string> = {
          queued: "Queued for Refresh",
          in_progress: "In Progress",
          refreshed: "Refreshed",
        };
        const label = data.status ? statusLabels[data.status] || data.status : "Cleared";
        toast({
          title: "Status Updated",
          description: `${data.updated} page${data.updated > 1 ? "s" : ""} marked as "${label}".`,
        });
      },
      onError: () => {
        toast({
          title: "Update Failed",
          description: "Could not update page status.",
          variant: "destructive",
        });
      }
    }
  });

  return {
    uploadCsv: uploadCsvMutation,
    uploadSemrushCsv: uploadSemrushCsvMutation,
    deletePage: deletePageMutation,
    batchStatus: batchStatusMutation
  };
}
