import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDynamicContent = () => {
  return useQuery({
    queryKey: ["site_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*");
      if (error) throw error;
      
      const contentMap: Record<string, { ar: string; en: string }> = {};
      data.forEach(item => {
        contentMap[item.key] = {
          ar: item.value_ar,
          en: item.value_en
        };
      });
      return contentMap;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ["public_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
