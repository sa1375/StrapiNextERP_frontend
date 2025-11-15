// app/categories/features/new.tsx

import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/lib/axios";

const formSchema = z.object({
  name: z.string().min(1).max(40),
  description: z.string().min(5).max(200).optional(),
});

export type CategoryItem = {
  id?: number;
  documentId?: string;
  name?: string;
  description?: string;
};

type NewProps = {
  item?: CategoryItem | null;
  onSuccess?: () => void;
  isOpen?: boolean;
};

export default function New({ item = null, onSuccess, isOpen }: NewProps) {
  const [loading, SetLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [item, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    SetLoading(true);
    if (item) {
      await axiosInstance.put(`/api/categories/${item.documentId}`, {
        data: values,
      });
    } else {
      await axiosInstance.post("/api/categories", {
        data: values,
      });
    }
    toast.success("Category Created Successfuly");
    if (onSuccess) onSuccess();
    SetLoading(false);
  }

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{item?.id ? "Edit" : "Add"}</SheetTitle>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 px-3 py-10"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name" type="text" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Category Description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </form>
        </Form>
      </SheetHeader>
    </SheetContent>
  );
}
