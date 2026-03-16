import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetPages, 
  useGetStats, 
  useUploadCsv, 
  useDeletePage,
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

  return {
    uploadCsv: uploadCsvMutation,
    deletePage: deletePageMutation
  };
}
